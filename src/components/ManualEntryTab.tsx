'use client';

import React, { useMemo, useState } from 'react';
import { useReports } from '../context/ReportContext';
import {
  calculateWorkingHours,
  formatDateWithDay,
  formatNumber,
} from '../utils/formatters';

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ManualEntryTab() {
  const { reports, allDriverNames, addReport, setActiveTab } = useReports();

  const [date, setDate] = useState<string>(getTodayDateString);
  const [driverSelect, setDriverSelect] = useState<string>(
    allDriverNames[0] ?? '田中 健一（田中急便）'
  );
  const [customDriver, setCustomDriver] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('17:30');
  const [breakMinutes, setBreakMinutes] = useState<number>(60);
  const [highwayFee, setHighwayFee] = useState<string>('0');
  const [deliveryCount, setDeliveryCount] = useState<string>('30');
  const [expenses, setExpenses] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [initialStatus, setInitialStatus] = useState<'承認済' | '未確認'>('承認済');
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string>('');

  const computedHours = calculateWorkingHours(startTime, endTime, breakMinutes);

  const manualHistory = useMemo(
    () => reports.filter((r) => r.source === '手動入力').slice(0, 5),
    [reports]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDriver =
      driverSelect === '__custom__' ? customDriver.trim() : driverSelect;

    if (!targetDriver) {
      setErrorMessage('ドライバー名を選択するか、直接入力してください。');
      return;
    }
    if (!date) {
      setErrorMessage('報告日を入力してください。');
      return;
    }

    setErrorMessage('');

    addReport({
      date,
      driverName: targetDriver,
      startTime,
      endTime,
      workingHours: computedHours,
      highwayFee: Number(highwayFee) || 0,
      deliveryCount: Number(deliveryCount) || 0,
      expenses: Number(expenses) || 0,
      notes: notes.trim() || '紙日報より事務所にて代理入力',
      status: initialStatus,
      source: '手動入力',
    });

    if (continuousMode) {
      setSavedNotice(
        `${targetDriver}（${date}）の日報を登録しました。続けて次の紙日報を入力できます。`
      );
      setHighwayFee('0');
      setExpenses('0');
      setNotes('');
    } else {
      setActiveTab('list');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 画面説明ヘッダー */}
      <div className="bg-white border border-slate-300 p-5">
        <h2 className="text-[19px] font-bold text-slate-900">
          紙で提出された日報の手動登録（事務所・代理入力用）
        </h2>
        <p className="text-[15px] text-slate-600 mt-1">
          スマートフォンを持たないドライバーや協力会社から紙で提出された日報を、Tabキーとテンキーで素早く入力できます。登録した内容はLINE提出分と同じ台帳・月末支払明細書に自動で合算されます。
        </p>
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-300">
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-300 font-bold text-[16px] text-slate-800">
          日報入力シート
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 font-bold text-[14px] rounded">
              {errorMessage}
            </div>
          )}

          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-400 text-emerald-950 font-bold text-[14px] rounded flex items-center justify-between">
              <span>{savedNotice}</span>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3 py-1 bg-emerald-800 text-white text-[13px] rounded cursor-pointer"
              >
                一覧画面で確認する
              </button>
            </div>
          )}

          {/* 行1: 報告日 ＆ ドライバー名 */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-4">
              <label
                htmlFor="manual-date"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                報告日（稼働日） <span className="text-red-600 text-[13px]">必須</span>
              </label>
              <input
                id="manual-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[46px] px-3.5 text-[16px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div className="col-span-8">
              <label
                htmlFor="manual-driver"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                ドライバー名 / 協力会社名 <span className="text-red-600 text-[13px]">必須</span>
              </label>
              <div className="flex gap-3">
                <select
                  id="manual-driver"
                  value={driverSelect}
                  onChange={(e) => setDriverSelect(e.target.value)}
                  className="flex-1 h-[46px] px-3.5 text-[16px] bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                >
                  {allDriverNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__custom__">＋ 新しいドライバー・庸車先を直接入力</option>
                </select>

                {driverSelect === '__custom__' && (
                  <input
                    type="text"
                    value={customDriver}
                    onChange={(e) => setCustomDriver(e.target.value)}
                    placeholder="氏名・会社名を入力"
                    className="flex-1 h-[46px] px-3.5 text-[16px] bg-slate-50 border border-slate-400 rounded focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 行2: 開始時間・終了時間・休憩控除・実働時間 */}
          <div className="grid grid-cols-12 gap-5 items-end bg-slate-50 p-4 border border-slate-200 rounded">
            <div className="col-span-3">
              <label
                htmlFor="manual-start"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                業務開始時間
              </label>
              <input
                id="manual-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-[46px] px-3 text-[16px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div className="col-span-3">
              <label
                htmlFor="manual-end"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                業務終了時間
              </label>
              <input
                id="manual-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-[46px] px-3 text-[16px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div className="col-span-3">
              <label
                htmlFor="manual-break"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                休憩時間（控除）
              </label>
              <select
                id="manual-break"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full h-[46px] px-3 text-[15px] font-num bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
              >
                <option value={0}>0分（休憩なし）</option>
                <option value={45}>45分</option>
                <option value={60}>60分（1時間）</option>
                <option value={90}>90分（1.5時間）</option>
                <option value={120}>120分（2時間）</option>
              </select>
            </div>

            <div className="col-span-3">
              <div className="text-[13px] font-bold text-slate-600 mb-1">
                自動計算 実働時間
              </div>
              <div className="h-[46px] px-4 bg-white border border-slate-300 rounded flex items-center justify-end font-num text-[18px] font-bold text-slate-900">
                {computedHours.toFixed(1)} 時間
              </div>
            </div>
          </div>

          {/* 行3: 高速代・配達件数・立替経費 */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="manual-highway"
                  className="text-[15px] font-bold text-slate-800"
                >
                  高速道路料金（円）
                </label>
                <button
                  type="button"
                  onClick={() => setHighwayFee('0')}
                  className="px-2.5 py-0.5 text-[12px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded cursor-pointer"
                >
                  利用なし（0円）
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="manual-highway"
                  type="number"
                  min={0}
                  step={10}
                  value={highwayFee}
                  onChange={(e) => setHighwayFee(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-9 text-[17px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                />
                <span className="absolute right-3.5 text-[15px] text-slate-600 font-semibold">
                  円
                </span>
              </div>
            </div>

            <div className="col-span-4">
              <label
                htmlFor="manual-delivery"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                配達完了件数（件）
              </label>
              <div className="relative flex items-center">
                <input
                  id="manual-delivery"
                  type="number"
                  min={0}
                  value={deliveryCount}
                  onChange={(e) => setDeliveryCount(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-9 text-[17px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                />
                <span className="absolute right-3.5 text-[15px] text-slate-600 font-semibold">
                  件
                </span>
              </div>
            </div>

            <div className="col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="manual-expenses"
                  className="text-[15px] font-bold text-slate-800"
                >
                  立替経費（円）
                </label>
                <button
                  type="button"
                  onClick={() => setExpenses('0')}
                  className="px-2.5 py-0.5 text-[12px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded cursor-pointer"
                >
                  なし（0円）
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="manual-expenses"
                  type="number"
                  min={0}
                  step={10}
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-9 text-[17px] font-num text-right bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
                />
                <span className="absolute right-3.5 text-[15px] text-slate-600 font-semibold">
                  円
                </span>
              </div>
            </div>
          </div>

          {/* 行4: 備考 ＆ 登録時ステータス */}
          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-8">
              <label
                htmlFor="manual-notes"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                備考（紙日報のメモ・駐車場領収書など）
              </label>
              <input
                id="manual-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="未入力の場合は「紙日報より事務所にて代理入力」と記録されます"
                className="w-full h-[46px] px-3.5 text-[15px] bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="col-span-4">
              <label
                htmlFor="manual-status"
                className="block text-[15px] font-bold text-slate-800 mb-1.5"
              >
                登録時の確認ステータス
              </label>
              <select
                id="manual-status"
                value={initialStatus}
                onChange={(e) =>
                  setInitialStatus(e.target.value as '承認済' | '未確認')
                }
                className="w-full h-[46px] px-3.5 text-[15px] font-bold bg-white border border-slate-300 rounded focus:outline-none focus:border-slate-900"
              >
                <option value="承認済">承認済として登録（確認済の紙日報）</option>
                <option value="未確認">未確認として登録（後で社長が確認）</option>
              </select>
            </div>
          </div>

          {/* 送信ボタンエリア */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
              />
              <span className="text-[15px] font-semibold text-slate-800">
                続けて次の紙日報を入力する（登録後にこの画面のままにする）
              </span>
            </label>

            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[16px] rounded cursor-pointer transition-colors whitespace-nowrap"
            >
              日報を登録する（一覧へ追加）
            </button>
          </div>
        </div>
      </form>

      {/* 直近の手動登録履歴 */}
      <div className="bg-white border border-slate-300">
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-300 font-bold text-[14px] text-slate-700">
          最近手動登録された紙日報（直近5件）
        </div>
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">日付</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">ドライバー名</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">稼働時間</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold">高速代</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold">配達件数</th>
              <th className="border border-slate-300 px-3 py-2 text-left font-bold">備考</th>
            </tr>
          </thead>
          <tbody>
            {manualHistory.map((item) => (
              <tr key={item.id}>
                <td className="border border-slate-300 px-3 py-2 font-num whitespace-nowrap">
                  {formatDateWithDay(item.date)}
                </td>
                <td className="border border-slate-300 px-3 py-2 font-bold whitespace-nowrap">
                  {item.driverName}
                </td>
                <td className="border border-slate-300 px-3 py-2 font-num whitespace-nowrap">
                  {item.startTime}〜{item.endTime}（{item.workingHours.toFixed(1)}h）
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right font-num whitespace-nowrap">
                  {formatNumber(item.highwayFee)}円
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right font-num whitespace-nowrap">
                  {item.deliveryCount}件
                </td>
                <td className="border border-slate-300 px-3 py-2 text-slate-600">
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
