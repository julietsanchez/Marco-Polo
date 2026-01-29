"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { DbItem } from "@/lib/types";

const EditSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().positive("Monto mayor a 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  note: z.string().optional().nullable(),
  movement_type: z.enum(["income", "expense"]).optional(),
  active: z.boolean().optional(),
});

type EditFormData = z.infer<typeof EditSchema>;

interface ModalEditItemProps {
  item: DbItem;
  onClose: () => void;
  onSubmit: (data: EditFormData) => Promise<void>;
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

export function ModalEditItem({ item, onClose, onSubmit }: ModalEditItemProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMovement = item.kind === "movement";
  const isRecurringReceivablePayable =
    item.kind === "recurring" ||
    item.kind === "receivable" ||
    item.kind === "payable";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      description: item.description,
      amount: Number(item.amount),
      date: item.date,
      note: item.note ?? "",
      movement_type: (item.movement_type as "income" | "expense") ?? "expense",
      active: item.active ?? true,
    },
  });

  useEffect(() => {
    reset({
      description: item.description,
      amount: Number(item.amount),
      date: item.date,
      note: item.note ?? "",
      movement_type: (item.movement_type as "income" | "expense") ?? "expense",
      active: item.active ?? true,
    });
  }, [item, reset]);

  async function handleOk(values: EditFormData) {
    setError(null);
    if (isMovement && !values.movement_type) {
      setError("Elegí Ingreso o Gasto.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
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
      aria-labelledby="modal-edit-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-edit-title" className="text-lg font-semibold text-slate-800 mb-4">
          Editar — {kindLabel(item)}
        </h2>
        <form onSubmit={handleSubmit(handleOk)} className="space-y-4">
          {isMovement && (
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
            <label htmlFor="edit-date" className="block text-sm font-medium text-slate-700 mb-1">
              Fecha
            </label>
            <input
              id="edit-date"
              type="date"
              {...register("date")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Descripción *
            </label>
            <input
              id="edit-desc"
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
            <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-700 mb-1">
              Monto *
            </label>
            <input
              id="edit-amount"
              type="number"
              step="0.01"
              {...register("amount")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {isRecurringReceivablePayable && (
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                {...register("active")}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="edit-active" className="text-sm font-medium text-slate-700">
                Activo
              </label>
            </div>
          )}

          <div>
            <label htmlFor="edit-note" className="block text-sm font-medium text-slate-700 mb-1">
              Nota (opcional)
            </label>
            <input
              id="edit-note"
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
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
