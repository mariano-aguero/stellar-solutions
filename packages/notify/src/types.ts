export interface PaymentEvent {
  type: 'payment';
  hash: string;
  pagingToken: string;
  from: string;
  to: string;
  amount: string;
  asset: string; // 'native' or 'USDC:GISSUER...'
  createdAt: string;
}

export interface SorobanEvent {
  type: 'soroban';
  hash: string;
  pagingToken: string;
  contractId: string;
  functionName: string;
  createdAt: string;
}

export interface OtherEvent {
  type: 'other';
  hash: string;
  pagingToken: string;
  operationTypes: string[];
  createdAt: string;
}

export type StellarEvent = PaymentEvent | SorobanEvent | OtherEvent;

/**
 * Simplified Horizon operation record — what we actually get back from streaming
 * `/operations/forAccount/…`. Each SSE event is a single op with inline fields
 * (payments include from/to/amount, invoke_host_function includes function/parameters).
 * Transactions streamed via `/transactions` do NOT include operations inline — they
 * expose an async `operations()` method — so we stream `/operations` instead.
 */
export interface HorizonOperation {
  type: string;
  transaction_hash: string;
  paging_token: string;
  created_at: string;
  source_account?: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  contract_id?: string;
  function?: string;
  // path_payment_strict_send uses dest_amount / to_asset_* for the destination side.
  dest_amount?: string;
  to_asset_type?: string;
  to_asset_code?: string;
  to_asset_issuer?: string;
  // create_account payload
  account?: string;
  funder?: string;
  starting_balance?: string;
}
