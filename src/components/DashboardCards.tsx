"use client";

import type { DbItem } from "@/lib/types";

interface DashboardData {
  balance: number;
  recurringTotal: number;
  recurringList: DbItem[];
  receivableTotal: number;
  receivableList: DbItem[];
  payableTotal: number;
  payableList: DbItem[];
}

interface DashboardCardsProps {
  data: DashboardData;
  onEditBalance: () => void;
  onCompleteReceivable: (id: string) => void;
  onCompletePayable: (id: string) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function DashboardCards({
  data,
  onEditBalance,
  onCompleteReceivable,
  onCompletePayable,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Saldo en cuenta</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{fmt(data.balance)}</p>
        <button
          type="button"
          onClick={onEditBalance}
          className="text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          Editar
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Gastos recurrentes</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{fmt(data.recurringTotal)}</p>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {data.recurringList.length === 0 ? (
            <li className="text-slate-400">Ninguno</li>
          ) : (
            data.recurringList.slice(0, 5).map((i) => (
              <li key={i.id} className="flex justify-between">
                <span className="truncate max-w-[140px]">{i.description}</span>
                <span>{fmt(Number(i.amount))}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-1">A cobrar</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{fmt(data.receivableTotal)}</p>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {data.receivableList.length === 0 ? (
            <li className="text-slate-400">Ninguno</li>
          ) : (
            data.receivableList.slice(0, 5).map((i) => (
              <li key={i.id} className="flex justify-between items-center gap-2">
                <span className="truncate max-w-[100px]">{i.description}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {fmt(Number(i.amount))}
                  <button
                    type="button"
                    onClick={() => onCompleteReceivable(i.id)}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Cobrar
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 mb-1">A pagar</h3>
        <p className="text-2xl font-bold text-slate-900 mb-3">{fmt(data.payableTotal)}</p>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {data.payableList.length === 0 ? (
            <li className="text-slate-400">Ninguno</li>
          ) : (
            data.payableList.slice(0, 5).map((i) => (
              <li key={i.id} className="flex justify-between items-center gap-2">
                <span className="truncate max-w-[100px]">{i.description}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {fmt(Number(i.amount))}
                  <button
                    type="button"
                    onClick={() => onCompletePayable(i.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Pagar
                  </button>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
