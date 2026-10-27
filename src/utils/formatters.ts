import { DailyReport } from '../types/report';

/**
 * 開始時刻と終了時刻（HH:mm）および休憩時間（分）から実働時間（小数第1位）を算出
 */
export function calculateWorkingHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 60
): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (
    Number.isNaN(startH) ||
    Number.isNaN(startM) ||
    Number.isNaN(endH) ||
    Number.isNaN(endM)
  ) {
    return 0;
  }

  let totalMinutes = endH * 60 + endM - (startH * 60 + startM);
  // 日跨ぎ運行（例: 22:00〜06:00）にも対応
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  const netMinutes = Math.max(0, totalMinutes - breakMinutes);
  return Math.round((netMinutes / 60) * 10) / 10;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * YYYY-MM-DD を YYYY/MM/DD (曜) 形式へ変換
 */
export function formatDateWithDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  const dayName = WEEKDAYS[dateObj.getDay()] ?? '';
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}/${mm}/${dd} (${dayName})`;
}

/**
 * YYYY-MM-DD を MM/DD (曜) 形式へ変換（帳票内訳用）
 */
export function formatShortDateWithDay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  const dayName = WEEKDAYS[dateObj.getDay()] ?? '';
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${mm}/${dd} (${dayName})`;
}

/**
 * YYYY-MM-DD を YYYY/MM/DD 形式へ変換
 */
export function formatSlashDate(dateStr: string): string {
  return dateStr.replace(/-/g, '/');
}

/**
 * 3桁カンマ区切り数値フォーマット
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(Math.round(num));
}

/**
 * Excelで文字化けしないBOM付きUTF-8 CSVをダウンロード出力
 */
export function exportReportsToCsv(reports: DailyReport[], filenamePrefix: string = '運送日報一覧'): void {
  const headers = [
    '登録元',
    '日付',
    'ドライバー名',
    '開始時間',
    '終了時間',
    '実働時間(h)',
    '高速代(円)',
    '配達件数(件)',
    '立替経費(円)',
    'ステータス',
    '備考',
  ];

  const escapeCsvCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = reports.map((r) => [
    r.source,
    r.date,
    r.driverName,
    r.startTime,
    r.endTime,
    r.workingHours,
    r.highwayFee,
    r.deliveryCount,
    r.expenses,
    r.status,
    r.notes,
  ]);

  const csvBody = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  // UTF-8 BOM for Microsoft Excel
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
