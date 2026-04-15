export interface PaymentEvent {
  type: 'payment';
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;  // 'native' or 'USDC:GISSUER...'
  createdAt: string;
}

export interface SorobanEvent {
  type: 'soroban';
  hash: string;
  contractId: string;
  functionName: string;
  createdAt: string;
}

export interface OtherEvent {
  type: 'other';
  hash: string;
  operationTypes: string[];
  createdAt: string;
}

export type StellarEvent = PaymentEvent | SorobanEvent | OtherEvent;

// Simplified Horizon transaction record shape for parsing
export interface HorizonTxRecord {
  hash: string;
  created_at: string;
  operations?: HorizonOperation[];
}

export interface HorizonOperation {
  type: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  contract_id?: string;
  function?: string;
}
