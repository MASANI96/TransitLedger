export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  driverName: string; // ドライバー名 / 協力会社名
  startTime: string; // 開始時間 (HH:mm)
  endTime: string; // 終了時間 (HH:mm)
  workingHours: number; // 実働時間（自動計算または入力）
  highwayFee: number; // 高速料金（円）
  deliveryCount: number; // 配達件数（件）
  expenses: number; // 立替経費（円）
  notes: string; // 備考
  status: '未確認' | '承認済'; // ステータス
  source: 'LINE' | '手動入力'; // 登録元
}

export interface ChatMessage {
  id: string;
  sender: 'system' | 'driver';
  text: string;
  timestamp: string;
  subText?: string;
}

export interface DriverContractConfig {
  driverName: string;
  recipientTitle: string; // 御中 / 様 表記用
  companyLabel?: string;
  personLabel: string;
  dailyBaseRate: number; // 基本日当単価（税抜）
  perDeliveryBonus: number; // 配達1件あたり歩合（税抜・0円も可）
  bankInfo: string;
}
