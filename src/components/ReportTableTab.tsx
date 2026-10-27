'use client';

import React, { useMemo, useState } from 'react';
import { useReports } from '../context/ReportContext';
import { formatDateWithDay, formatNumber } from '../utils/formatters';

export function ReportTableTab() {
  const {
    reports,
    highlightedIds,
    allDriverNames,
    toggleReportStatus,
    approveAllReports,
    setActiveTab,
  } = useReports();

  const [selectedDriver, setSelectedDriver] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [unconfirmedOnly, setUnconfirmedOnly] = useState<boolean>(false);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedDriver !== 'ALL' && r.driverName !== selectedDriver) {
        return false;
      }
      if (selectedDate && r.date !== selectedDate) {
        return false;
      }
      if (unconfirmedOnly && r.status !== '未確認') {
        return false;
      }
      return true;
    });
  }, [reports, selectedDriver, selectedDate, unconfirmedOnly]);

  // 集計値（現在表示中のデータ合計 ＆ 今月全体合計）
  const summary = useMemo(() => {
    return filteredReports.reduce(
      (acc, cur) => {
        acc.count += 1;
        acc.workingHours += cur.workingHours;
        acc.highwayFee += cur.highwayFee;
        acc.deliveryCount += cur.deliveryCount;
        acc.expenses += cur.expenses;
        if (cur.status === '未確認') acc.unconfirmedCount += 1;
        return acc;
      },
      {
        count: 0,
        workingHours: 0,
        highwayFee: 0,
        deliveryCount: 0,
        expenses: 0,
        unconfirmedCount: 0,
      }
    );
  }, [filteredReports]);

  const unconfirmedIdsInView = useMemo(
    () => filteredReports.filter((r) => r.status === '未確認').map((r) => r.id),
    [filteredReports]
  );

  const hasActiveFilter =
    selectedDriver !== 'ALL' || selectedDate !== '' || unconfirmedOnly;

  const handleResetFilters = () => {
    setSelectedDriver('ALL');
    setSelectedDate('');
    setUnconfirmedOnly(false);
  };

  return (
    <div className="space-y-4">
      {/* 上部フィルタ・検索バー */}
      <div className="bg-white border border-slate-300 p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* ドライバー絞り込み */}
            <div>
              <label
                htmlFor="filter-driver"
                className="block text-[14px] font-bold text-slate-700 mb-1"
              >
                ドライバー / 協力会社で絞り込み
              </label>
              <select
                id="filter-driver"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="h-[42px] min-w-[230px] px-3 text-[15px] bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
              >
                <option value="ALL">すべてのドライバー（全件表示）</option>
                {allDriverNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 日付絞り込み */}
            <div>
              <label
                htmlFor="filter-date"
                className="block text-[14px] font-bold text-slate-700 mb-1"
              >
                稼働日で絞り込み
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="filter-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-[42px] px-3 text-[15px] font-num bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="h-[42px] px-3 text-[14px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded cursor-pointer whitespace-nowrap"
                  >
                    日付解除
                  </button>
                )}
              </div>
            </div>

            {/* 未確認のみ表示チェックボックス */}
            <label className="h-[42px] px-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unconfirmedOnly}
                onChange={(e) => setUnconfirmedOnly(e.target.checked)}
                className="w-4 h-4 accent-slate-900 cursor-pointer"
              />
              <span className="text-[15px] font-bold text-slate-800 whitespace-nowrap">
                未確認のみ表示
              </span>
            </label>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-[42px] px-3.5 text-[14px] font-semibold text-slate-700 hover:text-slate-950 underline cursor-pointer whitespace-nowrap"
              >
                絞り込みをすべて解除
              </button>
            )}
          </div>

          {/* 一括承認ボタン */}
          <div className="flex items-center gap-3">
            {unconfirmedIdsInView.length > 0 && (
              <button
                type="button"
                onClick={() => approveAllReports(unconfirmedIdsInView)}
                className="h-[42px] px-4 bg-slate-800 hover:bg-slate-900 text-white text-[14px] font-bold rounded cursor-pointer whitespace-nowrap transition-colors"
              >
                表示中の未確認（{unconfirmedIdsInView.length}件）を一括承認する
              </button>
            )}
          </div>
        </div>
      </div>

      {/* スプレッドシート風 日報テーブル */}
      <div className="bg-white border border-slate-400 overflow-x-auto">
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-[14px]">
          <div className="font-bold text-slate-800">
            日報台帳シート（表示件数：<span className="font-num">{filteredReports.length}</span>件
            {' / '}
            未確認残り：<span className="font-num text-amber-800">{summary.unconfirmedCount}</span>件）
          </div>
          <div className="text-[13px] text-slate-600">
            ※右端の「未確認」ボタンを押すと「承認済」に切り替わります
          </div>
        </div>

        <table className="w-full border-collapse text-[15px]">
          <thead>
            <tr className="bg-slate-200/80 text-slate-800 text-[14px]">
              <th className="border border-slate-300 px-2.5 py-2.5 text-center font-bold w-11 whitespace-nowrap">
                行
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold w-24 whitespace-nowrap">
                登録元
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-36 whitespace-nowrap">
                日付
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold min-w-[180px] whitespace-nowrap">
                ドライバー名
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold w-44 whitespace-nowrap">
                稼働時間（実働）
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-right font-bold w-28 whitespace-nowrap">
                高速代
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-right font-bold w-24 whitespace-nowrap">
                配達件数
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-right font-bold w-28 whitespace-nowrap">
                立替経費
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-left font-bold min-w-[200px]">
                備考
              </th>
              <th className="border border-slate-300 px-3 py-2.5 text-center font-bold w-32 whitespace-nowrap">
                確認ステータス
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border border-slate-300 px-6 py-12 text-center text-slate-600"
                >
                  <p className="text-[16px] font-bold text-slate-800 mb-2">
                    条件に一致する日報データがありません
                  </p>
                  <p className="text-[14px] text-slate-600 mb-4">
                    絞り込み条件を解除するか、左のLINE画面または「日報の手動登録」から日報を追加してください。
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-slate-800 text-white text-[14px] font-bold rounded cursor-pointer"
                      >
                        絞り込みを解除する
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-4 py-2 bg-white border border-slate-400 text-slate-800 text-[14px] font-bold rounded cursor-pointer hover:bg-slate-50"
                    >
                      紙日報を手動登録する
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReports.map((report, idx) => {
                const isNew = Boolean(highlightedIds[report.id]);
                const isUnconfirmed = report.status === '未確認';

                return (
                  <tr
                    key={report.id}
                    className={`transition-colors duration-300 ${
                      isNew
                        ? 'bg-emerald-100/90'
                        : isUnconfirmed
                        ? 'bg-amber-50/40 hover:bg-slate-100/80'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Excel風 行番号 */}
                    <td className="border border-slate-300 px-2 py-2.5 text-center text-[13px] font-num text-slate-500 bg-slate-50">
                      {idx + 1}
                    </td>

                    {/* 登録元 */}
                    <td className="border border-slate-300 px-2.5 py-2.5 text-center whitespace-nowrap">
                      {report.source === 'LINE' ? (
                        <span className="text-[13px] font-bold text-emerald-800">
                          [LINE]
                        </span>
                      ) : (
                        <span className="text-[13px] font-bold text-slate-700">
                          [手動]
                        </span>
                      )}
                      {isNew && (
                        <div className="text-[11px] font-bold text-emerald-900 mt-0.5">
                          新規反映
                        </div>
                      )}
                    </td>

                    {/* 日付 */}
                    <td className="border border-slate-300 px-3 py-2.5 font-num text-slate-900 whitespace-nowrap">
                      {formatDateWithDay(report.date)}
                    </td>

                    {/* ドライバー名 */}
                    <td className="border border-slate-300 px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {report.driverName}
                    </td>

                    {/* 稼働時間 */}
                    <td className="border border-slate-300 px-3 py-2.5 font-num text-slate-800 whitespace-nowrap">
                      {report.startTime}〜{report.endTime}{' '}
                      <span className="text-slate-600 font-semibold">
                        / {report.workingHours.toFixed(1)}h
                      </span>
                    </td>

                    {/* 高速代 */}
                    <td className="border border-slate-300 px-3 py-2.5 text-right font-num text-slate-900 whitespace-nowrap">
                      {report.highwayFee > 0 ? (
                        <span>{formatNumber(report.highwayFee)}円</span>
                      ) : (
                        <span className="text-slate-400">0円</span>
                      )}
                    </td>

                    {/* 配達件数 */}
                    <td className="border border-slate-300 px-3 py-2.5 text-right font-num font-semibold text-slate-900 whitespace-nowrap">
                      {formatNumber(report.deliveryCount)}件
                    </td>

                    {/* 立替経費 */}
                    <td className="border border-slate-300 px-3 py-2.5 text-right font-num text-slate-900 whitespace-nowrap">
                      {report.expenses > 0 ? (
                        <span>{formatNumber(report.expenses)}円</span>
                      ) : (
                        <span className="text-slate-400">0円</span>
                      )}
                    </td>

                    {/* 備考 */}
                    <td className="border border-slate-300 px-3 py-2.5 text-[14px] text-slate-700">
                      {report.notes || <span className="text-slate-400">—</span>}
                    </td>

                    {/* ステータス切替ボタン */}
                    <td className="border border-slate-300 px-2.5 py-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleReportStatus(report.id)}
                        title="クリックして確認ステータスを切り替え"
                        className={`w-full py-1.5 px-3 text-[14px] font-bold rounded border cursor-pointer transition-colors ${
                          isUnconfirmed
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {report.status}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* テーブル下部 今月合計行 */}
          {filteredReports.length > 0 && (
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-[15px]">
                <td
                  colSpan={4}
                  className="border border-slate-700 px-4 py-3 text-left whitespace-nowrap"
                >
                  {hasActiveFilter ? '絞り込み対象 合計' : '今月合計（全データ集計）'}（
                  <span className="font-num">{summary.count}</span>件）
                </td>
                <td className="border border-slate-700 px-3 py-3 text-left font-num whitespace-nowrap">
                  総実働 {summary.workingHours.toFixed(1)}h
                </td>
                <td className="border border-slate-700 px-3 py-3 text-right font-num whitespace-nowrap">
                  {formatNumber(summary.highwayFee)}円
                </td>
                <td className="border border-slate-700 px-3 py-3 text-right font-num whitespace-nowrap">
                  {formatNumber(summary.deliveryCount)}件
                </td>
                <td className="border border-slate-700 px-3 py-3 text-right font-num whitespace-nowrap">
                  {formatNumber(summary.expenses)}円
                </td>
                <td
                  colSpan={2}
                  className="border border-slate-700 px-3 py-3 text-right text-[13px] font-normal text-slate-200 whitespace-nowrap"
                >
                  立替計（高速＋経費）：
                  <span className="font-bold font-num text-white ml-1">
                    {formatNumber(summary.highwayFee + summary.expenses)}円
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
