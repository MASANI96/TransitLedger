'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  DRIVER_CONTRACTS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_DAILY_REPORTS,
  PRESET_DRIVERS,
} from '../data/mockReports';
import { ChatMessage, DailyReport, DriverContractConfig } from '../types/report';
import { formatNumber, formatSlashDate } from '../utils/formatters';

export type AdminTab = 'list' | 'statement' | 'manual';

interface NewReportInput {
  date: string;
  driverName: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  highwayFee: number;
  deliveryCount: number;
  expenses: number;
  notes: string;
  status?: '未確認' | '承認済';
  source: 'LINE' | '手動入力';
}

interface ReportContextValue {
  reports: DailyReport[];
  chatMessages: ChatMessage[];
  highlightedIds: Record<string, boolean>;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  latestNotification: string | null;
  clearNotification: () => void;
  allDriverNames: string[];
  getDriverContract: (driverName: string) => DriverContractConfig;
  updateDriverRate: (driverName: string, dailyBaseRate: number, perDeliveryBonus: number) => void;
  addReport: (input: NewReportInput) => DailyReport;
  toggleReportStatus: (id: string) => void;
  approveAllReports: (ids: string[]) => void;
  resetDemoData: () => void;
}

const ReportContext = createContext<ReportContextValue | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<DailyReport[]>(INITIAL_DAILY_REPORTS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [highlightedIds, setHighlightedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<AdminTab>('list');
  const [latestNotification, setLatestNotification] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Record<string, DriverContractConfig>>(DRIVER_CONTRACTS);

  const clearNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const addReport = useCallback((input: NewReportInput): DailyReport => {
    const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReport: DailyReport = {
      id,
      date: input.date,
      driverName: input.driverName.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      workingHours: input.workingHours,
      highwayFee: Math.max(0, Math.round(input.highwayFee)),
      deliveryCount: Math.max(0, Math.round(input.deliveryCount)),
      expenses: Math.max(0, Math.round(input.expenses)),
      notes: input.notes.trim(),
      status: input.status ?? (input.source === 'LINE' ? '未確認' : '承認済'),
      source: input.source,
    };

    setReports((prev) => [newReport, ...prev]);

    // Highlight newly added row for 5 seconds
    setHighlightedIds((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 5000);

    if (input.source === 'LINE') {
      const now = new Date();
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const slashDate = formatSlashDate(newReport.date);

      const userBubble: ChatMessage = {
        id: `msg-u-${Date.now()}`,
        sender: 'driver',
        text: `日報を送信しました（${slashDate}）\n担当：${newReport.driverName}\n稼働：${newReport.startTime}〜${newReport.endTime}（${newReport.workingHours.toFixed(1)}h）\n高速：${formatNumber(newReport.highwayFee)}円 / 配達：${newReport.deliveryCount}件${
          newReport.expenses > 0 ? `\n立替経費：${formatNumber(newReport.expenses)}円` : ''
        }`,
        timestamp: `今日 ${timeLabel}`,
      };

      const systemReply: ChatMessage = {
        id: `msg-s-${Date.now() + 1}`,
        sender: 'system',
        text: `${slashDate}分の業務日報を受け付けました。\n本部の管理画面へ即時反映いたしました。本日もお疲れ様でした。`,
        timestamp: `今日 ${timeLabel}`,
      };

      setChatMessages((prev) => [...prev, userBubble, systemReply]);
      setLatestNotification(
        `LINEから新しい日報が届きました：${newReport.driverName}（${slashDate} / 配達${newReport.deliveryCount}件）`
      );
    } else {
      setLatestNotification(
        `手動入力で日報を登録しました：${newReport.driverName}（${formatSlashDate(newReport.date)}）`
      );
    }

    return newReport;
  }, []);

  const toggleReportStatus = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === '未確認' ? '承認済' : '未確認' }
          : item
      )
    );
  }, []);

  const approveAllReports = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setReports((prev) =>
      prev.map((item) => (idSet.has(item.id) ? { ...item, status: '承認済' } : item))
    );
  }, []);

  const resetDemoData = useCallback(() => {
    setReports(INITIAL_DAILY_REPORTS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setHighlightedIds({});
    setLatestNotification('デモ用の初期データ状態にリセットしました。');
  }, []);

  const allDriverNames = useMemo(() => {
    const names = new Set<string>(PRESET_DRIVERS);
    reports.forEach((r) => {
      if (r.driverName) names.add(r.driverName);
    });
    return Array.from(names);
  }, [reports]);

  const getDriverContract = useCallback(
    (driverName: string): DriverContractConfig => {
      if (contracts[driverName]) {
        return contracts[driverName];
      }
      return {
        driverName,
        companyLabel: `${driverName} 御中`,
        personLabel: `${driverName} 様`,
        recipientTitle: `${driverName} 様`,
        dailyBaseRate: 19000,
        perDeliveryBonus: 100,
        bankInfo: 'ご指定振込口座（月末締め・翌月25日払い）',
      };
    },
    [contracts]
  );

  const updateDriverRate = useCallback(
    (driverName: string, dailyBaseRate: number, perDeliveryBonus: number) => {
      setContracts((prev) => {
        const existing = prev[driverName] ?? {
          driverName,
          companyLabel: `${driverName} 御中`,
          personLabel: `${driverName} 様`,
          recipientTitle: `${driverName} 様`,
          dailyBaseRate: 19000,
          perDeliveryBonus: 100,
          bankInfo: 'ご指定振込口座（月末締め・翌月25日払い）',
        };
        return {
          ...prev,
          [driverName]: {
            ...existing,
            dailyBaseRate: Math.max(0, dailyBaseRate),
            perDeliveryBonus: Math.max(0, perDeliveryBonus),
          },
        };
      });
    },
    []
  );

  const value = useMemo<ReportContextValue>(
    () => ({
      reports,
      chatMessages,
      highlightedIds,
      activeTab,
      setActiveTab,
      latestNotification,
      clearNotification,
      allDriverNames,
      getDriverContract,
      updateDriverRate,
      addReport,
      toggleReportStatus,
      approveAllReports,
      resetDemoData,
    }),
    [
      reports,
      chatMessages,
      highlightedIds,
      activeTab,
      latestNotification,
      clearNotification,
      allDriverNames,
      getDriverContract,
      updateDriverRate,
      addReport,
      toggleReportStatus,
      approveAllReports,
      resetDemoData,
    ]
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReports(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return ctx;
}
