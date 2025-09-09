
import React, { useContext } from "react";
import { type Chain } from "viem";
import { useChainId } from "wagmi";


export const ConfigChainsCTX = React.createContext<{ chains: Chain[] }>({ chains: [] })
export function ConfigChainsProvider({ children, chains }: { chains: Chain[], children: React.ReactNode }) {
    return <ConfigChainsCTX.Provider value={{ chains }}>
        {children}
    </ConfigChainsCTX.Provider>
}

export function useConfigChains() {
    return useContext(ConfigChainsCTX)
}


export function useNetWrong() {
    const { chains } = useConfigChains()
    const chainId = useChainId()
    return !chains.some(item => item.id == chainId)
}