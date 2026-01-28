"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const Schema = z.object({
  balance: z.coerce.number(),
});

type FormData = z.infer<typeof Schema>;

interface ModalEditBalanceProps {
  currentBalance: number;
  onClose: () => void;
  onSubmit: (balance: number) => Promise<void>;
}

export function ModalEditBalance({
  currentBalance,
  onClose,
  onSubmit,
}: ModalEditBalanceProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { balance: currentBalance },
  });

  async function handleOk(values: FormData) {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values.balance);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar saldo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-balance-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-edit-balance-title" className="text-lg font-semibold text-slate-800 mb-4">
          Editar saldo
        </h2>
        <form onSubmit={handleSubmit(handleOk)} className="space-y-4">
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-slate-700 mb-1">
              Saldo en cuenta
            </label>
            <input
              id="balance"
              type="number"
              step="0.01"
              {...register("balance")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            {errors.balance && (
              <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-2 justify-end">
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
