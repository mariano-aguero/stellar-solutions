import { StellarKit } from '@stellar-solutions/payments-kit';
import { Keypair } from '@stellar/stellar-sdk';

const SECRET = process.env['STELLAR_TEST_SECRET_KEY'];
const DESTINATION = process.env['STELLAR_TEST_DESTINATION'];

if (!SECRET || !DESTINATION) {
  console.error('Set STELLAR_TEST_SECRET_KEY and STELLAR_TEST_DESTINATION env vars');
  process.exit(1);
}

const kit = new StellarKit({ network: 'testnet' });
const address = Keypair.fromSecret(SECRET).publicKey();

console.log('=== @stellar-solutions/payments-kit demo ===\n');

const balance = await kit.getBalance(address);
console.log(`XLM balance: ${balance}`);

console.log('\nSending 1 XLM...');
const result = await kit.pay({
  from: SECRET,
  to: DESTINATION,
  amount: '1',
  asset: 'native',
  memo: 'payments-kit demo',
});
console.log(`Sent! Hash: ${result.hash}`);
console.log(`  Ledger: ${result.ledger}`);
console.log(`  Explorer: https://stellar.expert/explorer/testnet/tx/${result.hash}`);

const history = await kit.getHistory(address, { limit: 3 });
console.log('\nLast 3 transactions:');
for (const tx of history) console.log(`  ${tx.hash} — ${tx.createdAt}`);
