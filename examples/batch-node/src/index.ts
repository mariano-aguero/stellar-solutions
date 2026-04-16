import { StellarBatch } from '@stellar-solutions/batch';

const SECRET = process.env['STELLAR_FUNDING_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_DESTINATION_ADDRESS'];

if (!SECRET || !DESTINATION) {
  console.error('Set STELLAR_FUNDING_SECRET_KEY and STELLAR_DESTINATION_ADDRESS');
  process.exit(1);
}

const batch = new StellarBatch({ network: 'testnet', secretKey: SECRET });

const payments = Array.from({ length: 50 }, () => ({
  to: DESTINATION,
  amount: '0.01',
  asset: 'native' as const,
}));

const estimate = batch.estimate(payments);
console.log(`Sending ${payments.length} payments across ${estimate.txCount} transactions`);
console.log(`Estimated fee: ${estimate.estimatedFeeXLM} XLM`);
console.log(`Estimated time: ${estimate.estimatedTimeMs / 1000}s\n`);

const result = await batch.send(payments, {
  onProgress: (done, total) => {
    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\rProgress: ${done}/${total} (${pct}%)`);
  },
});

console.log('\n');
console.log(`Done!`);
console.log(`  Successful: ${result.successful}`);
console.log(`  Failed:     ${result.failed}`);
console.log(`  Tx hashes:  ${result.txHashes.join(', ')}`);
