import type {
  HorizonOperation,
  OtherEvent,
  PaymentEvent,
  SorobanEvent,
  StellarEvent,
} from './types.js';

function assetString(assetType?: string, assetCode?: string, assetIssuer?: string): string {
  if (!assetType || assetType === 'native') return 'native';
  return `${assetCode ?? ''}:${assetIssuer ?? ''}`;
}

const PAYMENT_OP_TYPES = new Set([
  'payment',
  'path_payment_strict_send',
  'path_payment_strict_receive',
]);

function toPaymentFields(op: HorizonOperation): { amount: string; asset: string } {
  // For path_payment_strict_send, `amount` is the SOURCE amount — what the destination
  // actually received lives under `dest_amount` + `to_asset_*`. Classic payment and
  // path_payment_strict_receive both expose the destination amount in `amount`/`asset_*`.
  if (op.type === 'path_payment_strict_send') {
    return {
      amount: op.dest_amount ?? op.amount ?? '0',
      asset: assetString(op.to_asset_type, op.to_asset_code, op.to_asset_issuer),
    };
  }
  return {
    amount: op.amount ?? '0',
    asset: assetString(op.asset_type, op.asset_code, op.asset_issuer),
  };
}

/**
 * Classify a single Horizon operation into a typed StellarEvent.
 * Emits one event per op, so a multi-op tx produces multiple events.
 */
export function parseOp(op: HorizonOperation): StellarEvent {
  if (PAYMENT_OP_TYPES.has(op.type)) {
    const fields = toPaymentFields(op);
    const event: PaymentEvent = {
      type: 'payment',
      hash: op.transaction_hash,
      pagingToken: op.paging_token,
      from: op.from ?? op.source_account ?? '',
      to: op.to ?? '',
      amount: fields.amount,
      asset: fields.asset,
      createdAt: op.created_at,
    };
    return event;
  }

  if (op.type === 'create_account') {
    // Treat account creation as a payment of XLM from funder → new account.
    const event: PaymentEvent = {
      type: 'payment',
      hash: op.transaction_hash,
      pagingToken: op.paging_token,
      from: op.funder ?? op.source_account ?? '',
      to: op.account ?? '',
      amount: op.starting_balance ?? '0',
      asset: 'native',
      createdAt: op.created_at,
    };
    return event;
  }

  if (op.type === 'invoke_host_function') {
    const event: SorobanEvent = {
      type: 'soroban',
      hash: op.transaction_hash,
      pagingToken: op.paging_token,
      contractId: op.contract_id ?? '',
      functionName: op.function ?? '',
      createdAt: op.created_at,
    };
    return event;
  }

  const other: OtherEvent = {
    type: 'other',
    hash: op.transaction_hash,
    pagingToken: op.paging_token,
    operationTypes: [op.type],
    createdAt: op.created_at,
  };
  return other;
}
