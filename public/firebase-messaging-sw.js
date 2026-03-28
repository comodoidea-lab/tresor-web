importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBF-O40hhmf5UwV_WDwt9ueLtUZUe54aeE',
  authDomain: 'tresor-app-cc24a.firebaseapp.com',
  projectId: 'tresor-app-cc24a',
  storageBucket: 'tresor-app-cc24a.firebasestorage.app',
  messagingSenderId: '175122653566',
  appId: '1:175122653566:web:bf21f6fc9d7b63a69a932f',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'trésor';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.fcmOptions?.link || 'https://tresor-web.vercel.app' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
