export type Asset =
  | 'native'
  | { code: string; issuer: string };

export interface TxResult {
  hash: string;
  ledger: number;
  fee: number;
  createdAt: string;
}

export interface HistoryEntry {
  hash: string;
  type: string;
  amount?: string;
  asset?: Asset;
  from?: string;
  to?: string;
  memo?: string;
  createdAt: string;
  ledger: number;
}

export interface Holder {
  address: string;
  balance: string;
}

export interface BatchPayment {
  to: string;
  amount: string;
  asset: Asset;
  memo?: string;
}

export interface BatchResult {
  successful: number;
  failed: number;
  errors: FailedPayment[];
  txHashes: string[];
}

export interface FailedPayment {
  index: number;
  payment: BatchPayment;
  reason: string;
  code?: string;
}
