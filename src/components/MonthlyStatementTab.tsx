'use client';

import React, { useMemo, useState } from 'react';
import { useReports } from '../context/ReportContext';
import { formatNumber, formatShortDateWithDay } from '../utils/formatters';

export function MonthlyStatementTab() {
  const { reports, allDriverNames, getDriverContract, updateDriverRate } = useReports();

  // 利用可能な対象月リスト（デフォルト 2026-10 を含む）
  const availableMonths = useMemo(() => {
    const set = new Set<string>(['2026-10', '2026-09']);
    reports.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        set.add(r.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [reports]);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedDriver, setSelectedDriver] = useState<string>(
    allDriverNames[0] ?? '田中 健一（田中急便）'
  );
  const [showRateEditor, setShowRateEditor] = useState<boolean>(false);

  const contract = getDriverContract(selectedDriver);

  // 対象月 × 対象ドライバーの日報を日付昇順で抽出
  const driverMonthlyReports = useMemo(() => {
    return reports
      .filter(
        (r) => r.driverName === selectedDriver && r.date.startsWith(selectedMonth)
      )
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [reports, selectedDriver, selectedMonth]);

  // 明細自動計算ロジック
  const calculation = useMemo(() => {
    const workDays = driverMonthlyReports.length;
    const totalHours = driverMonthlyReports.reduce((s, r) => s + r.workingHours, 0);
    const totalDeliveries = driverMonthlyReports.reduce((s, r) => s + r.deliveryCount, 0);
    const totalHighway = driverMonthlyReports.reduce((s, r) => s + r.highwayFee, 0);
    const totalExpenses = driverMonthlyReports.reduce((s, r) => s + r.expenses, 0);

    // 基本運賃・稼働合計（税抜）＝ 出勤日数 × 基本日当 ＋ 配達件数 × 個建て歩合
    const baseFreightExTax =
      workDays * contract.dailyBaseRate + totalDeliveries * contract.perDeliveryBonus;
    const consumptionTax = Math.floor(baseFreightExTax * 0.1);
    const baseFreightIncTax = baseFreightExTax + consumptionTax;

    // 立替精算合計（高速代＋立替経費：実費精算・税込相当）
    const totalReimbursements = totalHighway + totalExpenses;

    // 今月度お支払合計金額（税込）
    const grandTotalPayment = baseFreightIncTax + totalReimbursements;

    const unconfirmedCount = driverMonthlyReports.filter(
      (r) => r.status === '未確認'
    ).length;

    return {
      workDays,
      totalHours,
      totalDeliveries,
      totalHighway,
      totalExpenses,
      baseFreightExTax,
      consumptionTax,
      baseFreightIncTax,
      totalReimbursements,
      grandTotalPayment,
      unconfirmedCount,
    };
  }, [driverMonthlyReports, contract]);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const displayMonthLabel = `${yearStr}年${Number(monthStr)}月度`;

  // 翌月25日の振込期日表記を算出
  const paymentDueDateLabel = useMemo(() => {
    const y = Number(yearStr);
    const m = Number(monthStr);
    if (!y || !m) return '翌月25日';
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    return `${nextY}年${nextM}月25日`;
  }, [yearStr, monthStr]);

  // 発行日（対象月末日）
  const issueDateLabel = useMemo(() => {
    const y = Number(yearStr);
    const m = Number(monthStr);
    if (!y || !m) return '';
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}年${m}月${lastDay}日`;
  }, [yearStr, monthStr]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* 上部コントロールバー（印刷時は非表示） */}
      <div className="no-print bg-white border border-slate-300 p-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* 対象月選択 */}
            <div>
              <label
                htmlFor="stmt-month"
                className="block text-[14px] font-bold text-slate-700 mb-1"
              >
                集計対象月度
              </label>
              <select
                id="stmt-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-[44px] min-w-[165px] px-3 text-[15px] font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
              >
                {availableMonths.map((m) => {
                  const [yy, mm] = m.split('-');
                  return (
                    <option key={m} value={m}>
                      {yy}年{Number(mm)}月度
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 対象ドライバー選択 */}
            <div>
              <label
                htmlFor="stmt-driver"
                className="block text-[14px] font-bold text-slate-700 mb-1"
              >
                対象ドライバー / 協力会社
              </label>
              <select
                id="stmt-driver"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="h-[44px] min-w-[250px] px-3 text-[15px] font-bold bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-800"
              >
                {allDriverNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 単価調整トグル */}
            <button
              type="button"
              onClick={() => setShowRateEditor((prev) => !prev)}
              className="h-[44px] px-4 text-[14px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded cursor-pointer whitespace-nowrap"
            >
              {showRateEditor ? '単価設定を閉じる' : '契約単価を確認・変更'}
            </button>
          </div>

          {/* 印刷 / PDF保存ボタン */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-[46px] px-6 bg-blue-800 hover:bg-blue-900 text-white text-[16px] font-bold rounded cursor-pointer whitespace-nowrap transition-colors"
          >
            A4サイズで印刷 / PDF保存
          </button>
        </div>

        {/* 単価変更パネル（必要に応じて調整可能） */}
        {showRateEditor && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-6 text-[14px] bg-slate-50 p-3 rounded">
            <div className="font-bold text-slate-800">
              {selectedDriver} の計算単価設定（変更すると下の明細書へ即時反映）：
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700">基本日当（1日）：</label>
              <input
                type="number"
                step={500}
                min={0}
                value={contract.dailyBaseRate}
                onChange={(e) =>
                  updateDriverRate(
                    selectedDriver,
                    Number(e.target.value) || 0,
                    contract.perDeliveryBonus
                  )
                }
                className="w-28 px-2.5 py-1.5 text-right font-num bg-white border border-slate-300 rounded"
              />
              <span>円</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700">配達件数歩合（1件）：</label>
              <input
                type="number"
                step={10}
                min={0}
                value={contract.perDeliveryBonus}
                onChange={(e) =>
                  updateDriverRate(
                    selectedDriver,
                    contract.dailyBaseRate,
                    Number(e.target.value) || 0
                  )
                }
                className="w-24 px-2.5 py-1.5 text-right font-num bg-white border border-slate-300 rounded"
              />
              <span>円</span>
            </div>
          </div>
        )}

        {/* 未確認データが含まれる場合の注意案内 */}
        {calculation.unconfirmedCount > 0 && (
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-950 text-[13.5px] font-medium flex items-center justify-between">
            <span>
              ※このドライバーの当月日報に「未確認」が {calculation.unconfirmedCount}件 含まれています（未確認分も含めて試算表示中）。
            </span>
          </div>
        )}
      </div>

      {/* A4帳票プレビュー枠 */}
      <div className="print-only-container max-w-[820px] mx-auto bg-white border border-slate-300 px-10 py-9 text-slate-950">
        {/* 帳票最上部：タイトルと発行日 */}
        <div className="border-b-2 border-slate-900 pb-3 mb-6 flex items-end justify-between">
          <div>
            <div className="text-[12px] text-slate-600 font-semibold tracking-wider">
              {displayMonthLabel} 業務委託・庸車稼働精算書
            </div>
            <h2 className="text-[26px] font-bold tracking-widest text-slate-950 mt-0.5">
              支払明細書（控）
            </h2>
          </div>
          <div className="text-right text-[13px] font-num space-y-0.5">
            <div>明細書番号：MW-{yearStr}{monthStr}-{String(allDriverNames.indexOf(selectedDriver) + 101)}</div>
            <div>発行日：{issueDateLabel}</div>
          </div>
        </div>

        {/* 宛先（左） ＆ 発行元会社情報（右） */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* 宛先 */}
          <div className="col-span-7 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-800 pb-2 inline-block min-w-[320px]">
                {contract.companyLabel && (
                  <div className="text-[19px] font-bold text-slate-950">
                    {contract.companyLabel}
                  </div>
                )}
                <div className="text-[16px] font-semibold text-slate-800 mt-0.5">
                  {contract.personLabel}
                </div>
              </div>
              <p className="text-[13px] text-slate-700 mt-3 leading-relaxed">
                平素より格別のご協力を賜り厚く御礼申し上げます。
                <br />
                {displayMonthLabel}の日報集計に基づき、下記の通りお支払金額をご通知申し上げます。
              </p>
            </div>
          </div>

          {/* 発行元 */}
          <div className="col-span-5 relative border border-slate-300 p-3.5 bg-slate-50/50 text-[13px] leading-relaxed">
            <div className="font-bold text-[15px] text-slate-950 mb-1">
              TEST運送株式会社
            </div>
            <div>〒332-0015 埼玉県川口市川口3丁目2番1号</div>
            <div>代表取締役　山田 太郎</div>
            <div className="font-num">TEL：048-222-8190 / FAX：048-222-8191</div>
            <div className="font-num text-[12px] text-slate-600 mt-0.5">
              適格請求書発行事業者：T8030001094821
            </div>

            {/* 角印（控えめな朱色枠線印） */}
            <div
              aria-hidden="true"
              className="absolute top-3 right-3 w-14 h-14 border-2 border-red-700/80 text-red-700/85 flex items-center justify-center text-center text-[11px] font-bold leading-tight select-none"
            >
              TEST運送
              <br />
              株式会社
              <br />
              之印
            </div>
          </div>
        </div>

        {/* 今月度お支払合計金額 強調ブロック */}
        <div className="border-2 border-slate-900 mb-6">
          <div className="grid grid-cols-12 items-center">
            <div className="col-span-5 bg-slate-900 text-white px-5 py-3.5 font-bold text-[16px]">
              今月度 お支払合計金額（税込）
            </div>
            <div className="col-span-7 px-6 py-3 text-right font-num text-[26px] font-bold text-slate-950 tracking-tight">
              ¥{formatNumber(calculation.grandTotalPayment)} -
            </div>
          </div>
        </div>

        {/* 明細集計サマリー表 */}
        <div className="mb-6">
          <div className="text-[14px] font-bold text-slate-900 mb-1.5">
            1. 集計内訳サマリー（稼働実績：{calculation.workDays}日 ／ 総実働：
            <span className="font-num">{calculation.totalHours.toFixed(1)}</span>時間 ／ 総配達：
            <span className="font-num">{formatNumber(calculation.totalDeliveries)}</span>件）
          </div>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-400 px-3 py-2 text-left font-bold">
                  項目
                </th>
                <th className="border border-slate-400 px-3 py-2 text-left font-bold">
                  算出基礎・内訳
                </th>
                <th className="border border-slate-400 px-3 py-2 text-right font-bold w-36">
                  金額（円）
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 px-3 py-2 font-semibold">
                  基本運賃・稼働合計（税抜）
                </td>
                <td className="border border-slate-400 px-3 py-2 text-slate-700 font-num text-[13px]">
                  基本日当 {formatNumber(contract.dailyBaseRate)}円×{calculation.workDays}日 ＋ 件数歩合 {formatNumber(contract.perDeliveryBonus)}円×{formatNumber(calculation.totalDeliveries)}件
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right font-num font-semibold">
                  {formatNumber(calculation.baseFreightExTax)} 円
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 px-3 py-2 font-semibold">
                  消費税額（10%対象）
                </td>
                <td className="border border-slate-400 px-3 py-2 text-slate-700 font-num text-[13px]">
                  課税対象運賃 {formatNumber(calculation.baseFreightExTax)}円 × 10%
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right font-num font-semibold">
                  {formatNumber(calculation.consumptionTax)} 円
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 px-3 py-2 font-semibold">
                  高速道路料金 立替分合計
                </td>
                <td className="border border-slate-400 px-3 py-2 text-slate-700 text-[13px]">
                  日報申請に基づくETC・高速通行料実費精算（10%税込）
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right font-num font-semibold">
                  {formatNumber(calculation.totalHighway)} 円
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 px-3 py-2 font-semibold">
                  その他立替経費 合計
                </td>
                <td className="border border-slate-400 px-3 py-2 text-slate-700 text-[13px]">
                  荷捌き駐車場代・資材購入等の立替実費精算（10%税込）
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right font-num font-semibold">
                  {formatNumber(calculation.totalExpenses)} 円
                </td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td
                  colSpan={2}
                  className="border border-slate-400 px-3 py-2 text-right"
                >
                  今月度 お支払合計金額（税込）
                </td>
                <td className="border border-slate-400 px-3 py-2 text-right font-num text-[15px]">
                  {formatNumber(calculation.grandTotalPayment)} 円
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 日別内訳一覧テーブル */}
        <div className="mb-6">
          <div className="text-[14px] font-bold text-slate-900 mb-1.5">
            2. 日別稼働・立替内訳一覧
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-400 px-2.5 py-1.5 text-left font-bold w-24 whitespace-nowrap">
                  日付
                </th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-left font-bold w-32 whitespace-nowrap">
                  稼働時間
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-right font-bold w-16 whitespace-nowrap">
                  実働
                </th>
                <th className="border border-slate-400 px-2 py-1.5 text-right font-bold w-16 whitespace-nowrap">
                  件数
                </th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-right font-bold w-24 whitespace-nowrap">
                  基本運賃(税抜)
                </th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-right font-bold w-24 whitespace-nowrap">
                  高速代
                </th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-right font-bold w-24 whitespace-nowrap">
                  立替経費
                </th>
                <th className="border border-slate-400 px-2.5 py-1.5 text-left font-bold">
                  備考
                </th>
              </tr>
            </thead>
            <tbody>
              {driverMonthlyReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-slate-400 px-4 py-8 text-center text-slate-500"
                  >
                    選択された対象月・ドライバーの日報データはありません。
                  </td>
                </tr>
              ) : (
                driverMonthlyReports.map((r) => {
                  const dailyFreight =
                    contract.dailyBaseRate + r.deliveryCount * contract.perDeliveryBonus;
                  return (
                    <tr key={r.id}>
                      <td className="border border-slate-400 px-2.5 py-1.5 font-num whitespace-nowrap">
                        {formatShortDateWithDay(r.date)}
                      </td>
                      <td className="border border-slate-400 px-2.5 py-1.5 font-num whitespace-nowrap">
                        {r.startTime}〜{r.endTime}
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 text-right font-num whitespace-nowrap">
                        {r.workingHours.toFixed(1)}h
                      </td>
                      <td className="border border-slate-400 px-2 py-1.5 text-right font-num whitespace-nowrap">
                        {r.deliveryCount}件
                      </td>
                      <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num whitespace-nowrap">
                        {formatNumber(dailyFreight)}円
                      </td>
                      <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num whitespace-nowrap">
                        {formatNumber(r.highwayFee)}円
                      </td>
                      <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num whitespace-nowrap">
                        {formatNumber(r.expenses)}円
                      </td>
                      <td className="border border-slate-400 px-2.5 py-1.5 text-slate-700 text-[12px]">
                        {r.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {driverMonthlyReports.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan={2}
                    className="border border-slate-400 px-2.5 py-1.5 text-left"
                  >
                    日別合計（{calculation.workDays}日稼働）
                  </td>
                  <td className="border border-slate-400 px-2 py-1.5 text-right font-num">
                    {calculation.totalHours.toFixed(1)}h
                  </td>
                  <td className="border border-slate-400 px-2 py-1.5 text-right font-num">
                    {formatNumber(calculation.totalDeliveries)}件
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num">
                    {formatNumber(calculation.baseFreightExTax)}円
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num">
                    {formatNumber(calculation.totalHighway)}円
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1.5 text-right font-num">
                    {formatNumber(calculation.totalExpenses)}円
                  </td>
                  <td className="border border-slate-400 px-2.5 py-1.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 備考・お振込期日欄 */}
        <div className="border border-slate-400 p-3.5 text-[13px] space-y-1.5">
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-800">お振込予定日：</span>
            <span className="col-span-9 font-bold text-slate-950">
              {paymentDueDateLabel}（金融機関休業日の場合は翌営業日）
            </span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 font-bold text-slate-800">お振込先口座：</span>
            <span className="col-span-9 font-num text-slate-800">{contract.bankInfo}</span>
          </div>
          <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200">
            <span className="col-span-3 font-bold text-slate-800">備考：</span>
            <span className="col-span-9 text-slate-700 leading-relaxed">
              LINEおよび事務所受付にて提出された日報データより自動集計しております。万一、稼働日数や立替金額に相違がある場合は、発行日より7日以内に本部経理担当までお申し出ください。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
