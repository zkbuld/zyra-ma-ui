
import React, { useContext } from "react";
import { type Chain } from "viem";
import { useChainId } from "wagmi";

// eslint-disable-next-line react-refresh/only-export-components
export const ConfigChainsCTX = React.createContext<{ chains: Chain[] }>({ chains: [] })
export function ConfigChainsProvider({ children, chains }: { chains: Chain[], children: React.ReactNode }) {
    return <ConfigChainsCTX.Provider value={{ chains }}>
        {children}
    </ConfigChainsCTX.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useConfigChains() {
    return useContext(ConfigChainsCTX)
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNetWrong() {
    const { chains } = useConfigChains()
    const chainId = useChainId()
    return !chains.some(item => item.id == chainId)
}