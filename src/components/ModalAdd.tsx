"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type AddKind = "movement" | "recurring" | "receivable" | "payable";

const BaseSchema = z.object({
  kind: z.enum(["movement", "recurring", "receivable", "payable"]),
  movement_type: z.enum(["income", "expense"]).optional(),
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().positive("Monto mayor a 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  note: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

type FormData = z.infer<typeof BaseSchema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ModalAddProps {
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
}

export function ModalAdd({ onClose, onSubmit }: ModalAddProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(BaseSchema),
    defaultValues: {
      kind: "movement",
      movement_type: "income",
      description: "",
      amount: 0,
      date: today(),
      note: "",
      active: true,
    },
  });

  const kind = watch("kind");

  async function handleOk(values: FormData) {
    setError(null);
    if (values.kind === "movement" && !values.movement_type) {
      setError("Elegí Ingreso o Gasto para movimiento.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 overflow-y-auto py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-add-title" className="text-lg font-semibold text-slate-800 mb-4">
          Agregar
        </h2>
        <form onSubmit={handleSubmit(handleOk)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              {...register("kind")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="movement">Movimiento (Ingreso o Gasto)</option>
              <option value="recurring">Recurrente (mensual)</option>
              <option value="receivable">A cobrar</option>
              <option value="payable">A pagar</option>
            </select>
          </div>

          {kind === "movement" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Movimiento
              </label>
              <select
                {...register("movement_type")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="add-date" className="block text-sm font-medium text-slate-700 mb-1">
              Fecha
            </label>
            <input
              id="add-date"
              type="date"
              {...register("date")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="add-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Descripción *
            </label>
            <input
              id="add-desc"
              type="text"
              {...register("description")}
              placeholder="Ej. Sueldo, Alquiler…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="add-amount" className="block text-sm font-medium text-slate-700 mb-1">
              Monto *
            </label>
            <input
              id="add-amount"
              type="number"
              step="0.01"
              {...register("amount")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {kind === "recurring" && (
            <div className="flex items-center gap-2">
              <input
                id="add-active"
                type="checkbox"
                {...register("active")}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="add-active" className="text-sm font-medium text-slate-700">
                Activo (mensual)
              </label>
            </div>
          )}

          <div>
            <label htmlFor="add-note" className="block text-sm font-medium text-slate-700 mb-1">
              Nota (opcional)
            </label>
            <input
              id="add-note"
              type="text"
              {...register("note")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
