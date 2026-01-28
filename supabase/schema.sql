-- Shared Budget MVP – Supabase Postgres
-- Ejecutar en SQL Editor de Supabase (Dashboard)

-- 1) Estado de la app (saldo manual)
create table if not exists app_state (
  id int primary key check (id = 1),
  balance numeric not null default 0,
  updated_at timestamptz default now()
);

-- Inicializar fila única
insert into app_state (id, balance)
values (1, 0)
on conflict (id) do nothing;

-- 2) Items (movimientos, recurrentes, a cobrar, a pagar, ajustes)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'movement', 'recurring', 'receivable', 'payable', 'balance_adjustment'
  )),
  movement_type text check (movement_type in ('income', 'expense')),
  description text not null,
  amount numeric not null,
  status text check (status in ('open', 'done')),
  date date not null,
  note text,
  active boolean,
  created_at timestamptz default now()
);

create index if not exists idx_items_date_desc on items (date desc);
create index if not exists idx_items_kind on items (kind);
create index if not exists idx_items_status on items (status);

-- NOTA: RLS y Auth no implementados en este MVP. Activar RLS y configurar políticas
-- cuando se añada autenticación.
