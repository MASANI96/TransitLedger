'use client';

import React, { useMemo } from 'react';
import { LineSimulator } from './components/LineSimulator';
import { ManualEntryTab } from './components/ManualEntryTab';
import { MonthlyStatementTab } from './components/MonthlyStatementTab';
import { ReportTableTab } from './components/ReportTableTab';
import { AdminTab, ReportProvider, useReports } from './context/ReportContext';
import { exportReportsToCsv } from './utils/formatters';

function AdminWorkspace() {
  const {
    reports,
    activeTab,
    setActiveTab,
    latestNotification,
    clearNotification,
    resetDemoData,
  } = useReports();

  const unconfirmedTotal = useMemo(
    () => reports.filter((r) => r.status === '未確認').length,
    [reports]
  );

  const tabs: { id: AdminTab; label: string }[] = [
    {
      id: 'list',
      label:
        unconfirmedTotal > 0
          ? `1. 日報一覧（未確認 ${unconfirmedTotal}件）`
          : '1. 日報一覧（スプレッドシート）',
    },
    {
      id: 'statement',
      label: '2. 月末集計・支払明細書（印刷用）',
    },
    {
      id: 'manual',
      label: '3. 日報の手動登録（紙日報用）',
    },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen print:min-h-0 bg-slate-100 print:bg-white">
      {/* 右側ヘッダー（印刷時は非表示） */}
      <header className="no-print bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-8">
        <div className="text-[19px] font-bold tracking-tight whitespace-nowrap shrink-0">
          TEST運送 日報・請求管理システム
        </div>

        <nav className="flex items-center gap-6 text-[14px] text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'list' ? 'text-white underline underline-offset-4 font-bold' : ''
            }`}
          >
            日報一覧
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'statement' ? 'text-white underline underline-offset-4 font-bold' : ''
            }`}
          >
            月末支払明細書
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'manual' ? 'text-white underline underline-offset-4 font-bold' : ''
            }`}
          >
            紙日報の手動登録
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-slate-400"
          >
            初期データに戻す
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => exportReportsToCsv(reports)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-[14px] font-bold rounded cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            Excel用CSV出力
          </button>
        </div>
      </header>

      {/* 上部大型業務タブバー（社長が迷わず押せる大きな切り替えタブ・印刷時は非表示） */}
      <div className="no-print bg-white border-b border-slate-300 px-6 pt-3">
        <div className="flex items-end gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-[16px] font-bold rounded-t border-t border-l border-r cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-950 border-slate-300 -mb-px pb-[13px]'
                    : 'bg-slate-50 hover:bg-slate-200/70 text-slate-600 border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* リアルタイム受信通知バー（LINE送信時などにわかりやすく通知・印刷時は非表示） */}
      {latestNotification && (
        <div className="no-print mx-6 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-400 text-emerald-950 flex items-center justify-between gap-4">
          <div className="font-bold text-[15px]">{latestNotification}</div>
          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[13.5px] font-bold rounded cursor-pointer whitespace-nowrap"
              >
                日報一覧を開く
              </button>
            )}
            {activeTab !== 'statement' && (
              <button
                type="button"
                onClick={() => setActiveTab('statement')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[13.5px] font-bold rounded cursor-pointer whitespace-nowrap"
              >
                支払明細の自動集計を見る
              </button>
            )}
            <button
              type="button"
              onClick={clearNotification}
              className="px-2.5 py-1 text-[13px] font-semibold text-emerald-900 hover:underline cursor-pointer whitespace-nowrap"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ領域 */}
      <main className="flex-1 p-6 print:p-0">
        {activeTab === 'list' && <ReportTableTab />}
        {activeTab === 'statement' && <MonthlyStatementTab />}
        {activeTab === 'manual' && <ManualEntryTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReportProvider>
      <div className="min-w-[1240px] print:min-w-0 min-h-screen print:min-h-0 flex print:block items-stretch bg-slate-100 print:bg-white">
        {/* 画面左側（固定幅 396px）：ドライバー用 LINE画面枠 */}
        <LineSimulator />

        {/* 画面右側（残りの領域）：社長・本部用 日報・請求管理システム */}
        <AdminWorkspace />
      </div>
    </ReportProvider>
  );
}
