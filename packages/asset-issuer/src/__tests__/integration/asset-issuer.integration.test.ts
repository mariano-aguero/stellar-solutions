import { describe, it, expect } from 'vitest';
import { StellarIssuer } from '../../StellarIssuer.js';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];

describe.skipIf(!SECRET)('asset-issuer integration (testnet)', () => {
  it('creates a token, mints additional supply, burns, and queries holders', async () => {
    const issuer = new StellarIssuer({
      network: 'testnet',
      fundingSecretKey: SECRET!,
    });

    const asset = await issuer.createAsset({ code: 'TSTKN', totalSupply: '1000' });
    expect(asset.explorerUrl).toContain('stellar.expert');
    expect(asset.txHashes.length).toBeGreaterThanOrEqual(2);

    const mintResult = await issuer.mintTo(asset.distributorAddress, '100');
    expect(typeof mintResult.hash).toBe('string');

    const burnResult = await issuer.burn('50');
    expect(typeof burnResult.hash).toBe('string');

    const holders = await issuer.getHolders();
    expect(holders.length).toBeGreaterThan(0);
  }, 120_000);
});
