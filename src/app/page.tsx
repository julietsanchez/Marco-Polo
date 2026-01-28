"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSecret } from "@/components/AppProviders";
import { Header } from "@/components/Header";
import { DashboardCards } from "@/components/DashboardCards";
import { HistoryTable } from "@/components/HistoryTable";
import { ModalAdd } from "@/components/ModalAdd";
import { ModalEditBalance } from "@/components/ModalEditBalance";
import { fetchApi } from "@/lib/api-client";
import type { DashboardData } from "@/lib/types";
import type { DbItem } from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 300;

export default function Home() {
  const { apiKey } = useAppSecret();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<DbItem[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalBalance, setModalBalance] = useState(false);
  const [historyKind, setHistoryKind] = useState("all");
  const [historyQInput, setHistoryQInput] = useState("");
  const [historyQ, setHistoryQ] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!apiKey) return;
    setLoadingDashboard(true);
    try {
      const data = await fetchApi<DashboardData>("/api/dashboard", { apiKey });
      setDashboard(data);
    } catch (e) {
      console.error("Dashboard fetch failed:", e);
    } finally {
      setLoadingDashboard(false);
    }
  }, [apiKey]);

  const loadHistory = useCallback(async () => {
    if (!apiKey) return;
    setLoadingHistory(true);
    try {
      const params: Record<string, string> = {};
      if (historyKind && historyKind !== "all") params.kind = historyKind;
      if (historyQ.trim()) params.q = historyQ.trim();
      const { items } = await fetchApi<{ items: DbItem[] }>("/api/history", {
        apiKey,
        params,
      });
      setHistory(items);
    } catch (e) {
      console.error("History fetch failed:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [apiKey, historyKind, historyQ]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setHistoryQ(historyQInput);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [historyQInput]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const refresh = useCallback(() => {
    loadDashboard();
    loadHistory();
  }, [loadDashboard, loadHistory]);

  const handleAdd = useCallback(
    async (data: {
      kind: string;
      movement_type?: string;
      description: string;
      amount: number;
      date: string;
      note?: string | null;
      status?: string;
      active?: boolean;
    }) => {
      if (!apiKey) throw new Error("Missing api key");
      await fetchApi("/api/items", {
        method: "POST",
        apiKey,
        body: {
          kind: data.kind,
          movement_type: data.kind === "movement" ? data.movement_type : undefined,
          description: data.description,
          amount: data.amount,
          date: data.date,
          note: data.note ?? null,
          status:
            data.kind === "receivable" || data.kind === "payable"
              ? data.status ?? "open"
              : undefined,
          active: data.kind === "recurring" ? (data.active ?? true) : undefined,
        },
      });
      refresh();
    },
    [apiKey, refresh]
  );

  const handleEditBalance = useCallback(
    async (balance: number) => {
      if (!apiKey) throw new Error("Missing api key");
      await fetchApi("/api/balance", {
        method: "POST",
        apiKey,
        body: { balance },
      });
      refresh();
    },
    [apiKey, refresh]
  );

  const handleComplete = useCallback(
    async (id: string) => {
      if (!apiKey) throw new Error("Missing api key");
      await fetchApi(`/api/items/${id}/complete`, {
        method: "POST",
        apiKey,
      });
      refresh();
    },
    [apiKey, refresh]
  );

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-600">
          Agregá <code className="bg-slate-100 px-1 rounded">?k=APP_SECRET</code> a la URL.
        </p>
      </div>
    );
  }

  const dashboardData: DashboardData = dashboard ?? {
    balance: 0,
    recurringTotal: 0,
    recurringList: [],
    receivableTotal: 0,
    receivableList: [],
    payableTotal: 0,
    payableList: [],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        onAdd={() => setModalAdd(true)}
        onEditBalance={() => setModalBalance(true)}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loadingDashboard ? (
          <div className="py-12 text-center text-slate-500">Cargando dashboard…</div>
        ) : (
          <DashboardCards
            data={dashboardData}
            onEditBalance={() => setModalBalance(true)}
            onCompleteReceivable={(id) => handleComplete(id)}
            onCompletePayable={(id) => handleComplete(id)}
          />
        )}
        <HistoryTable
          items={history}
          loading={loadingHistory}
          kindFilter={historyKind}
          q={historyQInput}
          onKindChange={setHistoryKind}
          onSearchChange={setHistoryQInput}
        />
      </main>

      {modalAdd && (
        <ModalAdd
          onClose={() => setModalAdd(false)}
          onSubmit={handleAdd}
        />
      )}
      {modalBalance && (
        <ModalEditBalance
          currentBalance={dashboardData.balance}
          onClose={() => setModalBalance(false)}
          onSubmit={handleEditBalance}
        />
      )}
    </div>
  );
}
