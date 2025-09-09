import logo from '@/assets/react.svg'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuery } from '@tanstack/react-query'
import { flatten, range } from 'es-toolkit'
import { now } from 'es-toolkit/compat'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import { erc20Abi, formatEther, formatUnits, parseUnits, type Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { DateRangePicker } from './components/date-picker'
import STable from './components/simple-table'
import { ConfigChainsProvider } from './components/support-chains'
import { Txs, withTokenApprove } from './components/txs'
import { Button } from './components/ui/button'
import { Checkbox } from './components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { abiMaStake, MaConfigs, type MaConfig } from './configs'
import { shortStr, toNumber, toUnix } from './lib/mutils'
import { getPC } from './lib/publicClient'

type ItemData = {
  user: Address,
  sn: string,
  amount: bigint,
  startDate: `${number}`, // unix 
  dueDate: `${number}`,
}

// const testData: ItemData[] = [
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
//   { user: zeroAddress, sn: '2352q45', amount: 1249000000000000000n, startDate: '1757433600', dueDate: '1757433600' },
// ]
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


const defDateRange: DateRange = { from: new Date(now() - 24 * 60 * 60 * 1000), to: new Date() }
function PendingMa({ maconfig, queryRecodes }: { maconfig: MaConfig, queryRecodes: ReturnType<typeof useAllRecodes> }) {
  const { address } = useAccount()
  const recodesSNmap = useMemo(() => {
    const map: { [k: string]: typeof queryRecodes.data[number] } = {}
    for (const item of queryRecodes.data) {
      map[item.sn] = item
    }
    return map
  }, [queryRecodes.data])

  const { data } = useQuery({
    queryKey: ['pending datas', maconfig.stake, address],
    initialData: [],
    enabled: Boolean(address),
    queryFn: async () => {
      const res = await fetch('https://desk.bitcoinzyra.io/api/v1/open/contract/pending', { method: 'GET', headers: { "X-Address": address! } })
      const data: { code: number, message: string, data: { address: Address, miningMachineSN: string, startDate: `${number}`, dueDate: `${number}`, amount: `${number}` }[] } = await res.json()
      return data.data.map(item => ({ user: item.address, sn: item.miningMachineSN, amount: parseUnits(item.amount, maconfig.assetDecimals), startDate: item.startDate, dueDate: item.dueDate } as ItemData))
    }
  })
  const [daterange, setDateRange] = useState<DateRange>(defDateRange)
  const fData = useMemo(() => {
    const isStaked = (item: ItemData) => Boolean(recodesSNmap[item.sn] && !recodesSNmap[item.sn].unstaked)
    const mdata = data.filter(item => !isStaked(item))
    if (!daterange || !daterange.from || !daterange.to) return mdata
    const from = new Date(daterange.from)
    const to = new Date(daterange.to)
    from.setHours(0, 0, 0)
    to.setHours(23, 59, 59)
    return mdata.filter((item) => toUnix(from) <= parseInt(item.startDate) && parseInt(item.startDate) <= toUnix(to))
  }, [daterange, data, recodesSNmap])

  const [selected, setSelected] = useState<ItemData[]>([])
  useEffect(() => {
    setSelected(old => old.filter(item => fData.includes(item)))
  }, [fData])
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
    const recods = selected.map(item => ({
      id: 0n,
      user: item.user,
      sn: item.sn,
      amount: item.amount,
      startTimestamp: BigInt(item.startDate),
      endTimestamp: BigInt(item.dueDate),
      unstaked: false
    }))
    return withTokenApprove({
      approves: [{ spender: maconfig.stake, token: maconfig.asset, amount: total }],
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
    <DateRangePicker date={daterange} onChange={setDateRange as any} />
    <div className='grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2'>
      {
        range(0, fData.length, MaxSelect).map((_, index) =>
          <div
            className='flex items-center gap-4 rounded border border-black/10 p-4 cursor-pointer'
            onClick={() => {
              if (selectedGroup === index) {
                setSelectedGroup(undefined)
                setSelected([])
              } else {
                setSelectedGroup(index)
                setSelected(fData.filter((_, i) => index * MaxSelect <= i && i < (index + 1) * MaxSelect))
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
        data={fData.map((item) => [
          shortStr(item.user),
          <div key={'sn'}>{item.sn}</div>,
          `${formatUnits(item.amount, maconfig.assetDecimals)}`,
          `${new Date(parseInt(item.startDate) * 1000).toLocaleDateString()}`,
          `${new Date(parseInt(item.dueDate) * 1000).toLocaleDateString()}`,
          <Checkbox
            key={`pendingcheck`}
            checked={selected.includes(item)}
          />
        ])}
      />
    </div>
    <div className='flex justify-between'>
      <div>Total: {formatUnits(total, maconfig.assetDecimals)}</div>
      <Txs tx='Stake' disabled={selected.length <= 0 || !address} txs={getTxs}
        onTxSuccess={() => {
          setSelectedGroup(undefined)
          setSelected([])
          queryRecodes.refetch()
        }}
      />
    </div>
  </div>
}
function MaturityMa({ maconfig, queryRecodes }: { maconfig: MaConfig, queryRecodes: ReturnType<typeof useAllRecodes> }) {
  const { address } = useAccount()
  const [selected, setSelected] = useState<typeof data>([])
  const [selectedGroup, setSelectedGroup] = useState<number>()

  const data = useMemo(() => queryRecodes.data.filter(item => toNumber(item.endTimestamp) < toUnix(now()) && !item.unstaked), [queryRecodes.data])
  useEffect(() => {
    setSelected(old => old.filter(item => data.includes(item)))
  }, [data])
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
          <div key={'sn'}>{item.sn}</div>,
          `${formatEther(item.amount)}`,
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
      <Button disabled={queryRecodes.isFetching} onClick={() => queryRecodes.refetch()}>{queryRecodes.isFetching && <Loader2Icon className="animate-spin" />} Refresh</Button>
      <Txs tx='UnStake' disabled={selected.length <= 0 || !address} txs={getTxs}
        onTxSuccess={() => {
          setSelectedGroup(undefined)
          setSelected([])
          queryRecodes.refetch()
        }}
      />
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
                <PendingMa maconfig={config} queryRecodes={queryRecodes} />
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
