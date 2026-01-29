"use client";

import Image from "next/image";
import { useAuth } from "./AppProviders";

interface HeaderProps {
  onAdd: () => void;
}

export function Header({ onAdd }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Alarico"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          <h1 className="text-xl font-semibold text-slate-800">Alarico</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-slate-600 hidden sm:inline">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={signOut}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
