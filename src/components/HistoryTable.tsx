"use client";

import type { DbItem } from "@/lib/types";

interface HistoryTableProps {
  items: DbItem[];
  loading: boolean;
  kindFilter: string;
  q: string;
  onKindChange: (k: string) => void;
  onSearchChange: (q: string) => void;
  onEdit: (item: DbItem) => void;
  onDelete: (id: string) => void;
}

const KIND_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
  { value: "receivable", label: "A cobrar" },
  { value: "payable", label: "A pagar" },
  { value: "recurring", label: "Recurrentes" },
];

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function kindLabel(item: DbItem): string {
  if (item.kind === "movement") {
    return item.movement_type === "income" ? "Ingreso" : "Gasto";
  }
  if (item.kind === "recurring") return "Recurrente";
  if (item.kind === "receivable") return "A cobrar";
  if (item.kind === "payable") return "A pagar";
  return item.kind;
}

function dateStr(s: string): string {
  try {
    return new Date(s + "T12:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export function HistoryTable({
  items,
  loading,
  kindFilter,
  q,
  onKindChange,
  onSearchChange,
  onEdit,
  onDelete,
}: HistoryTableProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Historial</h2>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar por descripción"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <select
          value={kindFilter}
          onChange={(e) => onKindChange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Sin registros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Descripción</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Monto</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700">{dateStr(i.date)}</td>
                    <td className="py-3 px-4 text-slate-700">{kindLabel(i)}</td>
                    <td className="py-3 px-4 text-slate-800">{i.description}</td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        i.kind === "movement" && i.movement_type === "income"
                          ? "text-green-600"
                          : i.kind === "movement" && i.movement_type === "expense"
                            ? "text-red-600"
                            : "text-slate-700"
                      }`}
                    >
                      {i.kind === "movement" && i.movement_type === "expense"
                        ? "-"
                        : ""}
                      {fmt(Math.abs(Number(i.amount)))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => onEdit(i)}
                          className="text-sm font-medium text-sky-600 hover:text-sky-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("¿Eliminar esta entrada?")) {
                              onDelete(i.id);
                            }
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
