import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import './index.css'
import '@mysten/dapp-kit/dist/index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

const selectedNetwork = import.meta.env.VITE_SUI_NETWORK ?? 'testnet'
const fullnodeUrl = import.meta.env.VITE_SUI_FULLNODE_URL ?? 'https://fullnode.testnet.sui.io:443'

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
