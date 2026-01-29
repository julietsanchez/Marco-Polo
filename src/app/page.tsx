"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AppProviders";
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  // Redirigir a login si no hay sesión
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoadingDashboard(true);
    try {
      const data = await fetchApi<DashboardData>("/api/dashboard", {});
      setDashboard(data);
    } catch (e) {
      console.error("Dashboard fetch failed:", e);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const params: Record<string, string> = {};
      if (historyKind && historyKind !== "all") params.kind = historyKind;
      if (historyQ.trim()) params.q = historyQ.trim();
      const { items } = await fetchApi<{ items: DbItem[] }>("/api/history", {
        params,
      });
      setHistory(items);
    } catch (e) {
      console.error("History fetch failed:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user, historyKind, historyQ]);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [loadDashboard, user]);

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
    if (user) {
      loadHistory();
    }
  }, [loadHistory, user]);

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
      await fetchApi("/api/items", {
        method: "POST",
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
    [refresh]
  );

  const handleEditBalance = useCallback(
    async (balance: number) => {
      await fetchApi("/api/balance", {
        method: "POST",
        body: { balance },
      });
      refresh();
    },
    [refresh]
  );

  const handleComplete = useCallback(
    async (id: string) => {
      await fetchApi(`/api/items/${id}/complete`, {
        method: "POST",
      });
      refresh();
    },
    [refresh]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null; // El useEffect redirigirá a login
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
