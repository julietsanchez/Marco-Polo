export type ItemKind =
  | "movement"
  | "recurring"
  | "receivable"
  | "payable"
  | "balance_adjustment";

export type MovementType = "income" | "expense";

export interface DbAppState {
  id: number;
  balance: number;
  updated_at: string;
}

export interface DbItem {
  id: string;
  kind: ItemKind;
  movement_type: MovementType | null;
  description: string;
  amount: number;
  date: string;
  note: string | null;
  active: boolean | null;
  created_at: string;
}

export interface DashboardData {
  balance: number;
  recurringTotal: number;
  recurringList: DbItem[];
  receivableTotal: number;
  receivableList: DbItem[];
  payableTotal: number;
  payableList: DbItem[];
}

export interface HistoryFilters {
  kind?: string;
  q?: string;
}
