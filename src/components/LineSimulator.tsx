'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReports } from '../context/ReportContext';
import { PRESET_DRIVERS } from '../data/mockReports';
import { calculateWorkingHours } from '../utils/formatters';

function getTodayDateString(): string {
  // デモデータの月度（2026年10月）に合わせて今日の日付を取得
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function LineSimulator() {
  const { chatMessages, addReport } = useReports();
  const [isLiffOpen, setIsLiffOpen] = useState(false);

  // LIFF Form States
  const [date, setDate] = useState<string>(getTodayDateString);
  const [driverSelect, setDriverSelect] = useState<string>(PRESET_DRIVERS[0]);
  const [customDriver, setCustomDriver] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('18:30');
  const [breakMinutes, setBreakMinutes] = useState<number>(60);
  const [highwayFee, setHighwayFee] = useState<string>('3200');
  const [deliveryCount, setDeliveryCount] = useState<string>('35');
  const [expenses, setExpenses] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const prevMsgCountRef = useRef<number>(chatMessages.length);

  useEffect(() => {
    // 新しいメッセージが追加された時のみ、トーク履歴コンテナ内部だけを最下部へスクロール
    if (chatMessages.length > prevMsgCountRef.current && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages.length]);

  const computedHours = calculateWorkingHours(startTime, endTime, breakMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedDriver =
      driverSelect === '__custom__' ? customDriver.trim() : driverSelect;

    if (!resolvedDriver) {
      setFormError('ドライバー名を入力してください。');
      return;
    }
    if (!date) {
      setFormError('報告日を選択してください。');
      return;
    }

    setFormError('');
    addReport({
      date,
      driverName: resolvedDriver,
      startTime,
      endTime,
      workingHours: computedHours,
      highwayFee: Number(highwayFee) || 0,
      deliveryCount: Number(deliveryCount) || 0,
      expenses: Number(expenses) || 0,
      notes,
      source: 'LINE',
      status: '未確認',
    });

    setIsLiffOpen(false);
    // 次回デモ入力しやすいよう備考のみクリア
    setNotes('');
  };

  return (
    <aside className="no-print w-[396px] shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col items-center justify-between py-3 px-3 select-none h-screen sticky top-0 overflow-hidden">
      {/* 上部説明ラベル */}
      <div className="w-full text-center pb-2">
        <div className="text-[14px] font-bold text-white tracking-wide">
          【ドライバー側】スマホLINE画面
        </div>
        <div className="text-[12px] text-slate-300">
          下のボタンから送信すると右の管理画面に即時反映されます
        </div>
      </div>

      {/* スマートフォン（iPhone風）外枠フレーム */}
      <div className="relative w-[356px] flex-1 max-h-[790px] min-h-[580px] bg-slate-950 rounded-[38px] p-[10px] border-[3px] border-slate-600 flex flex-col overflow-clip">
        {/* スマホ内部スクリーン */}
        <div className="relative w-full h-full bg-[#7494C0] rounded-[28px] overflow-clip flex flex-col">
          {/* iOSステータスバー */}
          <div className="bg-[#242B38] text-white px-5 pt-2 pb-1 flex items-center justify-between text-[12px] font-num shrink-0">
            <span className="font-semibold">18:42</span>
            <div className="w-16 h-3.5 bg-slate-950 rounded-full" aria-hidden="true" />
            <span className="text-[11px] tracking-tight">4G 92%</span>
          </div>

          {/* LINEトークヘッダー */}
          <div className="bg-[#242B38] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700/70 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-300 text-[15px] font-bold leading-none">＜</span>
              <span className="font-bold text-[15px] truncate">公式：運送日報受付</span>
            </div>
            <span className="text-[11px] text-slate-300 shrink-0">TEST運送(株)</span>
          </div>

          {/* LINEトーク履歴エリア */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 select-text"
          >
            <div className="text-center">
              <span className="inline-block bg-slate-900/25 text-white text-[11px] px-3 py-0.5 rounded">
                トーク履歴
              </span>
            </div>

            {chatMessages.map((msg) =>
              msg.sender === 'system' ? (
                <div key={msg.id} className="flex items-start gap-2 pr-5">
                  <div className="w-8 h-8 rounded bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-600">
                    本部
                  </div>
                  <div className="flex flex-col items-start max-w-[235px]">
                    <span className="text-[11px] text-slate-100 mb-0.5 font-medium">
                      公式：運送日報受付
                    </span>
                    <div className="bg-white text-slate-900 text-[13.5px] leading-relaxed px-3 py-2 rounded-lg whitespace-pre-wrap border border-slate-200/80">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-100/90 mt-0.5 font-num">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex flex-col items-end pl-8">
                  <div className="bg-[#8DE055] text-slate-950 text-[13.5px] leading-relaxed px-3 py-2 rounded-lg whitespace-pre-wrap max-w-[245px]">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-100/90 mt-0.5 font-num">
                    既読 {msg.timestamp}
                  </span>
                </div>
              )
            )}
          </div>

          {/* 下部リッチメニュー風 大型ボタンエリア */}
          <div className="bg-slate-100 border-t border-slate-300 p-3 shrink-0">
            <div className="text-[11px] font-semibold text-slate-600 text-center mb-1.5">
              ▼ メニュー（タップして日報提出）
            </div>
            <button
              type="button"
              onClick={() => setIsLiffOpen(true)}
              className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049f43] text-white font-bold text-[16px] rounded-lg transition-colors cursor-pointer border border-emerald-700/20 text-center"
            >
              日報を入力する（ここをタップ）
            </button>
          </div>

          {/* LIFF スライドアップ日報入力フォーム（開いている時のみ描画） */}
          {isLiffOpen && (
            <div className="absolute inset-x-0 bottom-0 top-[34px] bg-white z-20 flex flex-col rounded-t-2xl border-t border-slate-300 animate-[liffSlideUp_0.18s_ease-out]">
            {/* LIFF モーダルヘッダー */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 rounded-t-xl">
              <span className="font-bold text-[15px]">業務日報 入力フォーム</span>
              <button
                type="button"
                onClick={() => setIsLiffOpen(false)}
                className="px-2.5 py-1 text-[13px] font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer"
              >
                閉じる
              </button>
            </div>

            {/* LIFF スクロールフォーム本体 */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left select-text"
            >
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-[13px] font-medium rounded">
                  {formError}
                </div>
              )}

              {/* 1. 報告日 */}
              <div>
                <label className="block text-[13.5px] font-bold text-slate-800 mb-1">
                  報告日 <span className="text-red-600 text-[12px]">必須</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-[15px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              {/* 2. ドライバー名 */}
              <div>
                <label className="block text-[13.5px] font-bold text-slate-800 mb-1">
                  ドライバー名 / 協力会社名 <span className="text-red-600 text-[12px]">必須</span>
                </label>
                <select
                  value={driverSelect}
                  onChange={(e) => setDriverSelect(e.target.value)}
                  className="w-full px-3 py-2.5 text-[15px] bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                >
                  {PRESET_DRIVERS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="__custom__">その他（直接入力する）</option>
                </select>

                {driverSelect === '__custom__' && (
                  <input
                    type="text"
                    value={customDriver}
                    onChange={(e) => setCustomDriver(e.target.value)}
                    placeholder="氏名または会社名を入力"
                    className="mt-2 w-full px-3 py-2 text-[15px] bg-slate-50 border border-slate-400 rounded focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                )}
              </div>

              {/* 3. 業務開始・終了時間 */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1">
                      業務開始時間
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-[15px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1">
                      業務終了時間
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-[15px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                      required
                    />
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>休憩控除:</span>
                    <select
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[13px] font-num"
                    >
                      <option value={0}>0分</option>
                      <option value={45}>45分</option>
                      <option value={60}>60分(1h)</option>
                      <option value={90}>90分(1.5h)</option>
                      <option value={120}>120分(2h)</option>
                    </select>
                  </div>
                  <div className="font-bold text-slate-900 font-num">
                    実働：{computedHours.toFixed(1)} 時間
                  </div>
                </div>
              </div>

              {/* 4. 高速道路料金 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13.5px] font-bold text-slate-800">
                    高速道路料金（円）
                  </label>
                  <button
                    type="button"
                    onClick={() => setHighwayFee('0')}
                    className="px-2.5 py-1 text-[12px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded cursor-pointer"
                  >
                    利用なし（0円）
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    step={10}
                    inputMode="numeric"
                    value={highwayFee}
                    onChange={(e) => setHighwayFee(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-[16px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                  />
                  <span className="absolute right-3 text-[14px] text-slate-600 font-medium">
                    円
                  </span>
                </div>
              </div>

              {/* 5. 配達完了件数 & 6. 立替経費 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[13.5px] font-bold text-slate-800 mb-1">
                    配達完了件数
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={deliveryCount}
                      onChange={(e) => setDeliveryCount(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-[16px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                    />
                    <span className="absolute right-2.5 text-[14px] text-slate-600 font-medium">
                      件
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13.5px] font-bold text-slate-800">
                      立替経費
                    </label>
                    <button
                      type="button"
                      onClick={() => setExpenses('0')}
                      className="px-1.5 py-0.5 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                    >
                      0円
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      inputMode="numeric"
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-[16px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800"
                    />
                    <span className="absolute right-2.5 text-[14px] text-slate-600 font-medium">
                      円
                    </span>
                  </div>
                </div>
              </div>

              {/* 7. 備考 */}
              <div>
                <label className="block text-[13.5px] font-bold text-slate-800 mb-1">
                  備考（ルート・駐車場代内訳・待機など）
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例：首都高利用、品川納品先パーキング900円"
                  className="w-full px-3 py-2 text-[14px] bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-800 resize-none"
                />
              </div>

              {/* 送信ボタン */}
              <div className="pt-1 pb-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] active:bg-[#049f43] text-white font-bold text-[16px] rounded-lg transition-colors cursor-pointer"
                >
                  日報を本部に送信する
                </button>
              </div>
              </form>
            </div>
          )}

          {/* iPhoneホームバー */}
          <div className="bg-slate-100 pb-1.5 pt-0.5 flex justify-center shrink-0">
            <div className="w-28 h-1 bg-slate-400 rounded-full" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 下部補足 */}
      <div className="w-full text-center pt-1.5 text-[11.5px] text-slate-400">
        LINE公式アカウント ＋ LIFFフォーム連携イメージ
      </div>
    </aside>
  );
}
