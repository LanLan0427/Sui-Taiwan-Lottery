import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import './index.css'
import '@mysten/dapp-kit/dist/index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

function normalizeSuiChainId(raw?: string): 'sui:testnet' | 'sui:mainnet' | 'sui:devnet' | 'sui:localnet' {
  const cleaned = (raw ?? 'testnet').trim().toLowerCase()

  if (cleaned === 'sui:testnet' || cleaned === 'sui:mainnet' || cleaned === 'sui:devnet' || cleaned === 'sui:localnet') {
    return cleaned
  }

  if (cleaned === 'testnet' || cleaned === 'mainnet' || cleaned === 'devnet' || cleaned === 'localnet') {
    return `sui:${cleaned}` as 'sui:testnet' | 'sui:mainnet' | 'sui:devnet' | 'sui:localnet'
  }

  return 'sui:testnet'
}

const selectedNetwork = normalizeSuiChainId(import.meta.env.VITE_SUI_NETWORK)
const fullnodeUrl = (import.meta.env.VITE_SUI_FULLNODE_URL ?? 'https://fullnode.testnet.sui.io:443').trim()

const networks = {
  [selectedNetwork]: { url: fullnodeUrl },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={selectedNetwork}>
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
)
