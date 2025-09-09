import { getErrorMsg, handleError, promiseT, shortStr } from "@/lib/mutils"
import { getPC } from "@/lib/publicClient"
import { cn } from "@/lib/utils"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useMutation } from "@tanstack/react-query"
import { isNil } from "es-toolkit"
import { Check, Loader2Icon } from "lucide-react"
import { toast as tos } from 'sonner'
import { encodeFunctionData, erc20Abi, zeroAddress, type Address, type PublicClient, type SimulateContractParameters } from "viem"
import { useAccount, useSwitchChain, useWalletClient } from "wagmi"
import { create } from 'zustand'
import { SimpleDialog } from "./simple-dialog"
import { useConfigChains, useNetWrong } from "./support-chains"
import { Button } from "./ui/button"

export type TxConfig = SimulateContractParameters & { name?: string }
export type TX = TxConfig | (() => Promise<TxConfig>)

export const useTxsStore = create(() => ({ txs: [] as TxConfig[], progress: 0 }))
export function Txs({
    className, tx, txs, disabled, disableSendCalls = true, disableProgress, beforeSimulate = true, toast = true, onTxSuccess }:
    {
        disableSendCalls?: boolean,
        disableProgress?: boolean,
        beforeSimulate?: boolean,
        className?: string, tx: string, disabled?: boolean, txs: TX[] | (() => Promise<TX[]> | TX[]), toast?: boolean
        onTxSuccess?: () => void
    }) {
    const { data: wc } = useWalletClient()
    const { isConnected, chainId } = useAccount()
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!wc) return
            const pc = getPC(wc.chain.id);
            const calls = await promiseT(txs).then(items => Promise.all(items.map(promiseT)))
            console.info('calls:', wc.account.address, calls)
            try {
                if (disableSendCalls) {
                    throw new Error('disable wallet_sendCalls')
                }
                if (calls.length == 1) {
                    throw new Error('calls length one wallet_sendCalls')
                }
                const callsTxs = calls.map(item => ({ data: encodeFunctionData({ abi: item.abi, functionName: item.functionName, args: item.args }), to: item.address }));
                // const sendCalls = beforeSimulate ? (await pc.simulateCalls({ account: wc.account.address, calls: callsTxs }))
                const { id } = await wc.sendCalls({
                    account: wc.account.address,
                    calls: callsTxs,
                })
                while (true) {
                    const res = await wc.waitForCallsStatus({ id })
                    if (res.status == 'pending') continue
                    if (res.status == 'success') {
                        toast && tos.success("Transactions Success")
                        onTxSuccess?.()
                    } else {
                        throw new Error(`Transactions ${res.status} ${JSON.stringify(res)}`)
                    }
                    break
                }
            } catch (error) {
                const msg = getErrorMsg(error)
                const showTxsStat = !disableProgress && calls.length > 1
                if (msg && (msg.includes('wallet_sendCalls') || msg.includes("EIP-7702 not supported"))) {
                    let progress = 0;
                    showTxsStat && useTxsStore.setState({ txs: calls, progress })
                    for (const item of calls) {
                        const txconfig = beforeSimulate ? (await pc.simulateContract({ ...item, account: wc.account.address })).request : item;
                        const tx = await wc.writeContract(txconfig)
                        const res = await pc.waitForTransactionReceipt({ hash: tx, confirmations: 1 })
                        if (res.status !== 'success') throw new Error('Transactions Reverted')
                        progress++
                        showTxsStat && useTxsStore.setState({ progress })
                    }

                    toast && tos.success("Transactions Success")
                    useTxsStore.setState({ progress: 0, txs: [] })
                    onTxSuccess?.()
                }
            }
        },
        onError: (error) => {
            useTxsStore.setState({ progress: 0, txs: [] })
            toast && handleError(error)
        }
    })
    const txDisabled = disabled || isPending || (typeof txs !== 'function' && txs.length == 0) || !wc
    const { openConnectModal } = useConnectModal();
    const sc = useSwitchChain()
    const isNetWrong = useNetWrong()
    const { chains } = useConfigChains()
    if (!isConnected || isNil(chainId)) return <Button onClick={openConnectModal}>Connect</Button>
    if (isNetWrong) return <Button onClick={() => !sc.isPending && sc.switchChain({ chainId: chains[0].id })}>
        {sc.isPending && <Loader2Icon className="animate-spin" />}
        Switch Network
    </Button>
    return <Button className={cn('flex items-center justify-center gap-4', className)} onClick={() => mutate()} disabled={txDisabled}>
        {isPending && <Loader2Icon className="animate-spin" />}
        {tx}
    </Button>
}


export async function withTokenApprove({ approves, pc, user, tx }: {
    approves: { spender: Address, token: Address, amount: bigint, name?: string }[],
    pc: PublicClient
    user: Address,
    tx: TxConfig
}) {
    let nativeAmount = 0n;
    const needApproves = await Promise.all(approves.map(async item => {
        if (zeroAddress === item.token) {
            nativeAmount += item.amount;
            return null
        }
        const allowance = await pc.readContract({ abi: erc20Abi, address: item.token, functionName: 'allowance', args: [user, item.spender] })
        if (allowance >= item.amount) return null
        const name = item.name ?? `Approve ${shortStr(item.token)}`
        return { name, abi: erc20Abi, address: item.token, functionName: 'approve', args: [item.spender, item.amount] } as TxConfig
    })).then(txs => txs.filter(item => item !== null))
    return [...needApproves, { ...tx, ...(nativeAmount > 0n ? { value: nativeAmount } : {}) }]
}

export function TxsStat({ className }: { className?: string }) {
    const { txs, progress } = useTxsStore()
    if (txs.length == 0) return null
    return <SimpleDialog open disableClose className={cn('w-80 text-black dark:text-white flex flex-col gap-2 p-4', className)}>
        <div className='text-xl font-semibold'>Progress</div>
        <div className='flex flex-col gap-2 max-h-80 overflow-y-auto px-2.5'>
            {txs.map((tx, i) => <div key={`tx_item_stat_${i}`} className='animitem flex items-center gap-5 bg-primary/20 rounded-lg px-4 py-2'>
                <span className='font-semibold'>{i + 1}</span>
                {tx.name ?? tx.functionName}
                <div className={cn('ml-auto text-xl', { 'animate-spin': progress == i })}>
                    {progress == i && <Loader2Icon className="animate-spin" />}
                    {progress > i && <Check className='text-green-500' />}
                </div>
            </div>)}
        </div>
        <div className='opacity-80 text-center'>Will require multiple signatures, this will be simplified into 1 approval with future updates!</div>
    </SimpleDialog>
}