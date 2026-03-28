import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

admin.initializeApp();

const db = admin.firestore();

interface Settings {
  notificationHour?: number;
  notificationDaysBefore?: number;
  theme?: string;
}

interface FcmTokenDoc {
  token: string;
  createdAt: number;
}

interface TemplateAttribute {
  name: string;
  type: string;
}

interface Template {
  id: string;
  name: string;
  attributes: TemplateAttribute[];
}

interface Item {
  id: string;
  name: string;
  templateId: string;
  attributes: Record<string, string>;
}

function getDaysUntilJst(dateStr: string, jstToday: Date): number | null {
  if (!dateStr) return null;
  const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return null;
  const target = new Date(
    parseInt(parts[1]),
    parseInt(parts[2]) - 1,
    parseInt(parts[3])
  );
  const today = new Date(jstToday.getFullYear(), jstToday.getMonth(), jstToday.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const sendDailyNotifications = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const jstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const currentHour = jstNow.getHours();

    // Fetch all settings docs via collectionGroup
    const settingsSnap = await db.collectionGroup('settings').get();

    const tasks: Promise<void>[] = [];

    for (const settingDoc of settingsSnap.docs) {
      const settingData = settingDoc.data() as Settings;

      // Only process settings documents named 'default'
      if (settingDoc.id !== 'default') continue;

      const notificationHour = settingData.notificationHour ?? 9;
      if (notificationHour !== currentHour) continue;

      const daysBefore = settingData.notificationDaysBefore ?? 7;

      // Extract userId from path: users/{userId}/settings/default
      const pathParts = settingDoc.ref.path.split('/');
      if (pathParts.length < 4 || pathParts[0] !== 'users') continue;
      const userId = pathParts[1];

      tasks.push(processUserNotification(userId, daysBefore, jstNow));
    }

    await Promise.allSettled(tasks);
  });

async function processUserNotification(
  userId: string,
  daysBefore: number,
  jstNow: Date
): Promise<void> {
  // Get FCM tokens
  const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
  if (tokensSnap.empty) return;

  const tokens: Array<{ docId: string; token: string }> = tokensSnap.docs.map((d) => ({
    docId: d.id,
    token: (d.data() as FcmTokenDoc).token,
  }));

  // Get templates to find date-type attributes
  const templatesSnap = await db.collection('users').doc(userId).collection('templates').get();
  const dateAttributesByTemplate: Record<string, string[]> = {};
  for (const tDoc of templatesSnap.docs) {
    const tData = tDoc.data() as Template;
    const dateAttrs = (tData.attributes || [])
      .filter((a: TemplateAttribute) => a.type === 'date')
      .map((a: TemplateAttribute) => a.name);
    if (dateAttrs.length > 0) {
      dateAttributesByTemplate[tDoc.id] = dateAttrs;
    }
  }

  if (Object.keys(dateAttributesByTemplate).length === 0) return;

  // Get items
  const itemsSnap = await db.collection('users').doc(userId).collection('items').get();

  interface ExpiringItem {
    name: string;
    daysLeft: number;
  }

  const expiringItems: ExpiringItem[] = [];

  for (const iDoc of itemsSnap.docs) {
    const item = iDoc.data() as Item;
    const dateAttrs = dateAttributesByTemplate[item.templateId];
    if (!dateAttrs || dateAttrs.length === 0) continue;

    for (const attrName of dateAttrs) {
      const dateStr = item.attributes?.[attrName];
      if (!dateStr) continue;

      const daysLeft = getDaysUntilJst(dateStr, jstNow);
      if (daysLeft === null) continue;

      if (daysLeft >= 0 && daysLeft <= daysBefore) {
        expiringItems.push({ name: item.name, daysLeft });
        break; // only count each item once
      }
    }
  }

  if (expiringItems.length === 0) return;

  // Build notification message
  const count = expiringItems.length;
  const title =
    count === 1 && expiringItems[0].daysLeft === 0
      ? 'trésor: 期限が本日のアイテムがあります'
      : `trésor: ${count}件の期限が近づいています`;

  const preview = expiringItems
    .slice(0, 3)
    .map((i) => (i.daysLeft === 0 ? `${i.name}（本日）` : `${i.name}（あと${i.daysLeft}日）`))
    .join('、');

  const body = count > 3 ? `${preview} 他${count - 3}件` : preview;

  // Send to all tokens, remove invalid ones
  const invalidDocIds: string[] = [];

  await Promise.all(
    tokens.map(async ({ docId, token }) => {
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
          webpush: {
            fcmOptions: { link: 'https://tresor-web.vercel.app' },
          },
        });
      } catch (err: unknown) {
        const errorCode =
          err instanceof Error && 'errorInfo' in err
            ? (err as { errorInfo?: { code?: string } }).errorInfo?.code
            : undefined;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidDocIds.push(docId);
        } else {
          console.error(`Failed to send to token ${docId}:`, err);
        }
      }
    })
  );

  // Clean up invalid tokens
  for (const docId of invalidDocIds) {
    await db.collection('users').doc(userId).collection('fcmTokens').doc(docId).delete();
  }
}
