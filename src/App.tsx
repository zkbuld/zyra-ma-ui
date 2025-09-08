import logo from '@/assets/react.svg'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { flatten, range } from 'es-toolkit'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { erc20Abi, zeroAddress, type Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import STable from './components/simple-table'
import { ConfigChainsProvider } from './components/support-chains'
import { Txs, withTokenApprove } from './components/txs'
import { Checkbox } from './components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { abiMaStake, MaConfigs, type MaConfig } from './configs'
import { shortStr, toNumber, toUnix } from './lib/mutils'
import { getPC } from './lib/publicClient'
import { now } from 'es-toolkit/compat'

type ItemData = {
  user: Address,
  sn: string,
  amount: bigint,
  startDate: string,
  dueDate: string,
}

const testData: ItemData[] = [
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
  { user: zeroAddress, sn: '2352q45', amount: 1249000n, startDate: '2025-09-01', dueDate: '2026-09-01' },
]
const MaxSelect = 10;

function useAllRecodes(maconfig: MaConfig) {
  return useQuery({
    queryKey: ['AllRecodes', maconfig.chain, maconfig.stake],
    initialData: [],
    enabled: Boolean(maconfig),
    queryFn: async () => {
      const pc = getPC(maconfig.chain.id)
      const totalCount = await pc.readContract({ abi: abiMaStake, address: maconfig.stake, functionName: 'getStakeCount' })
      if (totalCount < 1n) return []
      const totalCountNum = parseInt(totalCount.toString())
      const chunkSize = 50
      const chunks = range(0, totalCountNum, chunkSize).map(offset => ({ start: BigInt(offset), count: BigInt(Math.min(chunkSize, totalCountNum - offset)) }))
      const datas = await Promise.all(chunks.map(({ start, count }) => pc.readContract({ abi: abiMaStake, address: maconfig.stake, functionName: 'getStakeRecords', args: [start, count] })))
      return flatten(datas)
    }
  })
}
function PendingMa({ maconfig }: { maconfig: MaConfig }) {
  const { address } = useAccount()
  const { data } = useQuery({
    queryKey: ['pending datas', maconfig.stake],
    initialData: testData,
    queryFn: async () => {
      return testData
    }
  })
  const [selected, setSelected] = useState<ItemData[]>([])
  const [selectedGroup, setSelectedGroup] = useState<number>()
  const refBody = useRef<HTMLTableSectionElement>(null)
  const changeChecked = (item: ItemData, checked: boolean) => {
    if (checked) {
      const nList = [...selected, item]
      if (nList.length > MaxSelect) return toast.error(`Max ${MaxSelect}!`)
      setSelected(nList)
      setSelectedGroup(undefined)
    } else {
      setSelected(selected.filter(s => s !== item))
      setSelectedGroup(undefined)
    }
  }
  const total = selected.reduce((sum, item) => item.amount + sum, 0n)
  const getTxs: Parameters<typeof Txs>['0']['txs'] = async () => {
    if (!selected.length || !address) return []
    const pc = getPC(maconfig.chain.id)
    const assetBalance = await pc.readContract({ abi: erc20Abi, functionName: 'balanceOf', address: maconfig.asset, args: [address] })
    if (assetBalance < total) throw new Error("Balance too low!")
    let nounce = await pc.readContract({ abi: abiMaStake, address: maconfig.stake, functionName: 'getStakeCount' })
    const recods: any[] = []
    for (const item of selected) {
      nounce++
      recods.push({
        id: nounce,
        user: item.user,
        sn: item.sn,
        amount: item.amount,
        startTimestamp: BigInt(toUnix(item.startDate)),
        endTimestamp: BigInt(toUnix(item.dueDate)),
        unstaked: false
      })
    }
    return withTokenApprove({
      approves: [{ spender: maconfig.stake, token: maconfig.asset, amount: 123n }],
      pc,
      user: address,
      tx: {
        abi: abiMaStake,
        functionName: 'stake',
        address: maconfig.stake,
        args: [total, recods]
      }
    })
  }

  return <div className='flex flex-col gap-5 mt-2'>
    <div className='grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2'>
      {
        range(0, data.length, MaxSelect).map((_, index) =>
          <div
            className='flex items-center gap-4 rounded border border-black/10 p-4 cursor-pointer'
            onClick={() => {
              if (selectedGroup === index) {
                setSelectedGroup(undefined)
                setSelected([])
              } else {
                setSelectedGroup(index)
                setSelected(data.filter((_, i) => index * MaxSelect <= i && i < (index + 1) * MaxSelect))
                refBody.current?.children[index * MaxSelect]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            key={index}>
            <Checkbox checked={selectedGroup == index} />
            {`Group ${index + 1}`}
          </div>)
      }
    </div>
    <div className='flex overflow-auto h-[600px]'>
      <STable
        refBody={refBody}
        header={['Address', 'Mining machine SN', 'Zyra amount', 'Start Date', 'Due Date', '']}
        rowClassName={(i) => selected.includes(data[i]) ? 'bg-primary/20' : ''}
        onClickRow={(i) => changeChecked(data[i], !selected.includes(data[i]))}
        data={data.map((item) => [
          shortStr(item.user),
          shortStr(item.sn),
          `${item.amount}`,
          `${item.startDate}`,
          `${item.dueDate}`,
          <Checkbox
            key={`pendingcheck`}
            checked={selected.includes(item)}
          />
        ])}
      />
    </div>
    <div className='flex justify-between'>
      <div>Total: {total}</div>
      <Txs tx='Stake' disabled={selected.length <= 0 || !address} txs={getTxs} />
    </div>
  </div>
}
function MaturityMa({ maconfig, queryRecodes }: { maconfig: MaConfig, queryRecodes: ReturnType<typeof useAllRecodes> }) {
  const { address } = useAccount()
  // const [data, setData] = useState<ItemData[]>(testData)
  const data = queryRecodes.data.filter(item => toNumber(item.endTimestamp) > toUnix(now()) && !item.unstaked)
  const [selected, setSelected] = useState<typeof data>([])
  const [selectedGroup, setSelectedGroup] = useState<number>()
  const refBody = useRef<HTMLTableSectionElement>(null)
  const changeChecked = (item: (typeof data)[number], checked: boolean) => {
    if (checked) {
      const nList = [...selected, item]
      if (nList.length > MaxSelect) return toast.error(`Max ${MaxSelect}!`)
      setSelected(nList)
    } else {
      setSelected(selected.filter(s => s !== item))
    }
  }
  const total = selected.reduce((sum, item) => item.amount + sum, 0n)
  const getTxs: Parameters<typeof Txs>['0']['txs'] = async () => {
    return [
      {
        abi: abiMaStake,
        functionName: 'unstake',
        address: maconfig.stake,
        args: [total, selected.map(item => item.id)]
      }
    ]
  }
  return <div className='flex flex-col gap-5 mt-2'>
    <div className='grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2'>
      {
        range(0, data.length, MaxSelect).map((_, index) =>
          <div
            className='flex items-center gap-4 rounded border border-black/10 p-4 cursor-pointer'
            onClick={() => {
              if (selectedGroup === index) {
                setSelectedGroup(undefined)
                setSelected([])
              } else {
                setSelectedGroup(index)
                setSelected(data.filter((_, i) => index * MaxSelect <= i && i < (index + 1) * MaxSelect))
                refBody.current?.children[index * MaxSelect]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            key={index}>
            <Checkbox checked={selectedGroup == index} />
            {`Group ${index + 1}`}
          </div>)
      }
    </div>
    <div className='flex overflow-auto h-[600px]'>
      <STable
        header={['Address', 'Mining machine SN', 'Zyra amount', 'Start Date', 'Due Date', '']}
        rowClassName={(i) => selected.includes(data[i]) ? 'bg-primary/20' : ''}
        onClickRow={(i) => changeChecked(data[i], !selected.includes(data[i]))}
        data={data.map((item) => [
          shortStr(item.user),
          shortStr(item.sn),
          `${item.amount}`,
          `${new Date(toNumber(item.startTimestamp) * 1000).toLocaleDateString()}`,
          `${new Date(toNumber(item.endTimestamp) * 1000).toLocaleDateString()}`,
          <Checkbox
            key={`check`}
            checked={selected.includes(item)}
          />
        ])}
      />
    </div>

    <div className='flex justify-between'>
      <div>Total: </div>
      <Txs tx='UnStake' disabled={selected.length <= 0 || !address} txs={getTxs} />
    </div>
  </div>
}

function App() {
  const chainId = useChainId()
  const config = MaConfigs.find(item => item.chain.id == chainId) ?? MaConfigs[0]
  const queryRecodes = useAllRecodes(config)
  return (
    <>
      <div className='fixed w-full top-0 left-0 backdrop-blur-lg bg-black/10 z-50'>
        <div className='flex items-center justify-between w-full p-5 max-w-5xl mx-auto'>
          <div className='flex items-center gap-5'>
            <img src={logo} />
            <span className='text-3xl'>Zyra Manager</span>
          </div>
          <ConnectButton />
        </div>
      </div>
      {
        config &&
        <div className='pt-40 w-full p-5 max-w-5xl mx-auto'>
          <ConfigChainsProvider chains={[config.chain]}>
            <Tabs defaultValue='Pending'>
              <TabsList>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Maturity">Maturity</TabsTrigger>
              </TabsList>
              <TabsContent value='Pending'>
                <PendingMa maconfig={config} />
              </TabsContent>
              <TabsContent value='Maturity'>
                <MaturityMa maconfig={config} queryRecodes={queryRecodes} />
              </TabsContent>
            </Tabs>
          </ConfigChainsProvider>
        </div>
      }
    </>
  )
}

export default App
