'use client'
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
import * as React from 'react';

import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createStorage } from 'wagmi';

const walletConnectProjectId = 'f6ed428863bd8b38d7f11d356f800195'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SUPPORT_CHAINS } from './configs';
import { ConfigChainsProvider } from './components/support-chains';


const qClient = new QueryClient({ defaultOptions: { queries: { retry: 3 } } })
const storage = createStorage({
  storage: {
    getItem: (key) => typeof window !== 'undefined' ? window.localStorage.getItem(key) : undefined,
    removeItem: (key) => typeof window !== 'undefined' ? window.localStorage.removeItem(key) : undefined,
    setItem: (key, value) => {
      if (key !== 'wagmi.cache' && typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    },
  },
})
const appName = 'Zyra'
const config = getDefaultConfig({
  appName,
  projectId: walletConnectProjectId,
  chains: SUPPORT_CHAINS,
  storage,
  ssr: false,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <ConfigChainsProvider chains={[...SUPPORT_CHAINS]}>
        <QueryClientProvider client={qClient}>
          <RainbowKitProvider locale='en-US' modalSize='compact' theme={lightTheme()}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </ConfigChainsProvider>
    </WagmiProvider>
  )
}