import { StellarNotify } from '@stellar-solutions/notify';

const WATCHED_ADDRESS =
  process.env['STELLAR_WATCHED_ADDRESS'] ??
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

const notifier = new StellarNotify({ network: 'testnet' });

console.log(`Watching account: ${WATCHED_ADDRESS}`);
console.log('Listening for transactions... (Ctrl+C to stop)\n');

notifier
  .watch(WATCHED_ADDRESS)
  .on('payment', (tx) => {
    console.log(`Payment: ${tx.amount} ${tx.asset} from ${tx.from} → ${tx.to}`);
    console.log(`  Tx: ${tx.hash}`);
  })
  .on('soroban', (tx) => {
    console.log(`Soroban: contract ${tx.contractId} → ${tx.functionName}`);
    console.log(`  Tx: ${tx.hash}`);
  })
  .on('other', (tx) => {
    console.log(`Other tx: ${tx.operationTypes.join(', ')} — ${tx.hash}`);
  })
  .on('error', (err) => {
    console.error('Watch error:', err.message);
  });

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  notifier.stopAll();
  process.exit(0);
});
