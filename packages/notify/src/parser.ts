import type { HorizonTxRecord, StellarEvent, PaymentEvent, SorobanEvent, OtherEvent } from './types.js';

function assetString(op: { asset_type?: string; asset_code?: string; asset_issuer?: string }): string {
  if (!op.asset_type || op.asset_type === 'native') return 'native';
  return `${op.asset_code ?? ''}:${op.asset_issuer ?? ''}`;
}

export function parseTx(tx: HorizonTxRecord): StellarEvent {
  const ops = tx.operations ?? [];
  const firstOp = ops[0];

  if (!firstOp) {
    const other: OtherEvent = { type: 'other', hash: tx.hash, operationTypes: [], createdAt: tx.created_at };
    return other;
  }

  if (firstOp.type === 'payment') {
    const event: PaymentEvent = {
      type: 'payment',
      hash: tx.hash,
      from: firstOp.from ?? '',
      to: firstOp.to ?? '',
      amount: firstOp.amount ?? '0',
      asset: assetString(firstOp),
      createdAt: tx.created_at,
    };
    return event;
  }

  if (firstOp.type === 'invoke_host_function') {
    const event: SorobanEvent = {
      type: 'soroban',
      hash: tx.hash,
      contractId: firstOp.contract_id ?? '',
      functionName: firstOp.function ?? '',
      createdAt: tx.created_at,
    };
    return event;
  }

  const other: OtherEvent = {
    type: 'other',
    hash: tx.hash,
    operationTypes: ops.map((op) => op.type),
    createdAt: tx.created_at,
  };
  return other;
}
