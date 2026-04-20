import {
  useSorobanBalance,
  useSorobanInvoke,
  useWallet,
} from '@stellar-solutions/soroban-react-hooks';

// Testnet SAC contract for USDC on Stellar
const SAC_CONTRACT_ID = 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU';
const DEMO_DESTINATION = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';

export function App() {
  const { address, connect, disconnect, isConnected, isLoading, error } = useWallet();
  const { data: balance } = useSorobanBalance(SAC_CONTRACT_ID, address ?? null);
  const { invoke, isPending } = useSorobanInvoke(SAC_CONTRACT_ID, 'transfer');

  return (
    <div
      style={{ fontFamily: 'sans-serif', maxWidth: 480, margin: '40px auto', padding: '0 16px' }}
    >
      <h1>Stellar Soroban Hooks Demo</h1>

      {!isConnected ? (
        <button onClick={connect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect Freighter'}
        </button>
      ) : (
        <div>
          <p>
            <strong>Address:</strong> {address}
          </p>
          <p>
            <strong>Balance:</strong> {balance ?? '...'} USDC
          </p>
          <button onClick={() => void invoke([DEMO_DESTINATION, '1', '7'])} disabled={isPending}>
            {isPending ? 'Sending...' : 'Transfer 1 USDC'}
          </button>
          <button onClick={disconnect} style={{ marginLeft: 8 }}>
            Disconnect
          </button>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  );
}
