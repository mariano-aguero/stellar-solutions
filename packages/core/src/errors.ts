export class StellarKitError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'StellarKitError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidAddressError extends StellarKitError {
  constructor(address: string) {
    super(`Invalid Stellar address: ${address}`, 'INVALID_ADDRESS');
    this.name = 'InvalidAddressError';
  }
}

export class InsufficientFundsError extends StellarKitError {
  constructor(details: { available: string; required: string }) {
    super(
      `Insufficient funds: available ${details.available}, required ${details.required}`,
      'INSUFFICIENT_FUNDS',
      details,
    );
    this.name = 'InsufficientFundsError';
  }
}

export class NetworkTimeoutError extends StellarKitError {
  constructor(timeoutMs = 30_000) {
    super(`Network request timed out after ${timeoutMs}ms`, 'NETWORK_TIMEOUT');
    this.name = 'NetworkTimeoutError';
  }
}

export class NoTrustlineError extends StellarKitError {
  constructor(address: string, assetCode: string) {
    super(`Account ${address} has no trustline for ${assetCode}`, 'NO_TRUSTLINE');
    this.name = 'NoTrustlineError';
  }
}

export class SequenceError extends StellarKitError {
  constructor() {
    super('Transaction sequence number mismatch — max retries exceeded', 'SEQUENCE_ERROR');
    this.name = 'SequenceError';
  }
}

export class InvalidAssetCodeError extends StellarKitError {
  constructor(code: string) {
    super(
      `Invalid asset code: "${code}" — must be 1–12 alphanumeric characters`,
      'INVALID_ASSET_CODE',
    );
    this.name = 'InvalidAssetCodeError';
  }
}

export class AssetAlreadyExistsError extends StellarKitError {
  constructor(code: string, issuer: string) {
    super(`Asset ${code} already exists on issuer ${issuer}`, 'ASSET_ALREADY_EXISTS');
    this.name = 'AssetAlreadyExistsError';
  }
}

export class IssuerLockedError extends StellarKitError {
  constructor() {
    super(
      'Issuer account is locked — minting is disabled. This is permanent.',
      'ISSUER_LOCKED',
    );
    this.name = 'IssuerLockedError';
  }
}

export class FreighterNotInstalledError extends StellarKitError {
  constructor() {
    super(
      'Freighter wallet extension is not installed. Install it from https://freighter.app',
      'FREIGHTER_NOT_INSTALLED',
    );
    this.name = 'FreighterNotInstalledError';
  }
}

export class NetworkMismatchError extends StellarKitError {
  constructor(expected: string, actual: string) {
    super(
      `Network mismatch: provider configured for ${expected}, wallet connected to ${actual}`,
      'NETWORK_MISMATCH',
    );
    this.name = 'NetworkMismatchError';
  }
}

export class EmptyBatchError extends StellarKitError {
  constructor() {
    super('Batch payments array is empty', 'EMPTY_BATCH');
    this.name = 'EmptyBatchError';
  }
}

export class BatchValidationError extends StellarKitError {
  readonly invalidIndices: readonly number[];

  constructor(invalidIndices: readonly number[]) {
    const copy = [...invalidIndices];
    super(
      `Batch contains invalid payments at indices: ${copy.join(', ')}`,
      'BATCH_VALIDATION_ERROR',
      { invalidIndices: copy },
    );
    this.name = 'BatchValidationError';
    this.invalidIndices = copy;
  }
}
