import { StellarIssuer } from '@stellar-solutions/asset-issuer';

const SECRET = process.env['STELLAR_FUNDING_SECRET_KEY'];

if (!SECRET) {
  console.error('Set STELLAR_FUNDING_SECRET_KEY to a testnet account with XLM');
  process.exit(1);
}

const issuer = new StellarIssuer({ network: 'testnet', fundingSecretKey: SECRET });

console.log('Creating asset DEMOTKN on testnet...');

const asset = await issuer.createAsset({ code: 'DEMOTKN', totalSupply: '10000' });

console.log('\nAsset created!');
console.log(`  Issuer:      ${asset.issuerAddress}`);
console.log(`  Distributor: ${asset.distributorAddress}`);
console.log(`  Explorer:    ${asset.explorerUrl}`);
console.log(`  Tx hashes:   ${asset.txHashes.join(', ')}`);

console.log('\nMinting 500 additional tokens to distributor...');
const mintResult = await issuer.mintTo(asset.distributorAddress, '500');
console.log(`  Mint tx: ${mintResult.hash}`);

console.log('\nBurning 100 tokens...');
const burnResult = await issuer.burn('100');
console.log(`  Burn tx: ${burnResult.hash}`);

console.log('\nQuerying holders...');
const holders = await issuer.getHolders();
console.log(`  Holders: ${holders.length}`);
for (const h of holders) {
  console.log(`    ${h.address}: ${h.balance}`);
}
