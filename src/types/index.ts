export interface Template {
  id: string;
  name: string;
  subLocations: string[];
  attributes: { name: string; type: 'text' | 'number' | 'date' | 'tag' | 'url' | 'checkbox' }[];
  createdAt: number;
  updatedAt: number;
  sortOrder?: number;
}

export interface Item {
  id: string;
  templateId: string;
  name: string;
  quantity: number;
  subLocation: string;
  attributes: Record<string, string>;
  note?: string;
  createdAt: number;
  updatedAt: number;
  sortOrder?: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  notificationDaysBefore: number;
  notificationHour: number;
}

export const PRESET_TEMPLATES: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '冷蔵庫',
    subLocations: ['上段', '中段', '下段', 'チルド室', '野菜室', 'ドアポケット'],
    attributes: [
      { name: '賞味期限', type: 'date' },
      { name: 'メモ', type: 'text' },
    ],
  },
  {
    name: '引き出し・棚',
    subLocations: ['1段目', '2段目', '3段目', '4段目', '天板'],
    attributes: [
      { name: 'カテゴリ', type: 'tag' },
      { name: '備考', type: 'text' },
    ],
  },
  {
    name: '商品在庫',
    subLocations: ['出品待ち', '出品中', '発送済み', '保管箱A', '保管箱B'],
    attributes: [
      { name: '仕入れ価格', type: 'number' },
      { name: '仕入れ日', type: 'date' },
      { name: '商品URL', type: 'url' },
      { name: 'JANコード', type: 'number' },
    ],
  },
  {
    name: '本棚',
    subLocations: ['最上段', '2段目', '3段目', '4段目', '最下段', '未整理'],
    attributes: [
      { name: '著者名', type: 'text' },
      { name: '出版社', type: 'text' },
      { name: 'カテゴリ', type: 'tag' },
      { name: '読了日', type: 'date' },
    ],
  },
  {
    name: 'デジタル資産',
    subLocations: ['クラウド', 'ローカルドライブ', '外付けHDD', 'サブスク'],
    attributes: [
      { name: 'ログインID', type: 'text' },
      { name: '関連URL', type: 'url' },
      { name: '更新日', type: 'date' },
    ],
  },
  {
    name: '買い物リスト',
    subLocations: ['スーパー', 'コンビニ', 'ドラッグストア', 'ホームセンター', 'ネット'],
    attributes: [
      { name: '購入済み', type: 'checkbox' },
      { name: '購入期限', type: 'date' },
      { name: '予算(円)', type: 'number' },
      { name: 'メモ', type: 'text' },
    ],
  },
  {
    name: 'アイデアノート',
    subLocations: ['仕事', 'プライベート', '読書メモ', '旅行', 'その他'],
    attributes: [
      { name: 'カテゴリ', type: 'tag' },
      { name: 'メモ', type: 'text' },
      { name: '参考URL', type: 'url' },
      { name: '実行済み', type: 'checkbox' },
    ],
  },
];
