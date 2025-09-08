import {
  apiBatchConfig,
  multicallBatchConfig,
  SUPPORT_CHAINS,
} from "@/configs";
import { flatten } from "es-toolkit";
import { keys } from "es-toolkit/compat";

import { type Chain, createPublicClient, http, type PublicClient } from "viem";

const pcMaps: {
  [id: number]: { pcs: PublicClient[]; next: number; time: number };
} = {};
function getRpcurls(chain: Chain) {
  const mkeys = keys(chain.rpcUrls);
  return flatten(mkeys.map((item) => chain.rpcUrls[item].http));
}
function createPCS(chainId: number) {
  const chain = SUPPORT_CHAINS.find((c) => c.id == chainId)!;
  if (!chain) throw `No Chain for chianId:${chainId}`;
  const rpcls = getRpcurls(chain);
  if (rpcls.length == 0) throw `No Chain rpc for chianId:${chainId}`;
  const pcs = rpcls.map((url) => {
    const pc = createPublicClient({
      batch: { multicall: multicallBatchConfig },
      chain: SUPPORT_CHAINS.find((c) => c.id == chainId)!,
      transport: http(url, { batch: apiBatchConfig }),
    });
    const originRead = pc.readContract;
    pc.readContract = async (...args) => {
      try {
        // useReadingCountStore.getState().upReadingCount(1)
        // await isBusy()
        return await originRead(...args);
      } catch (error) {
        console.error("readError", error, "\nArgs", [...args]);
        throw error;
      } finally {
        // useReadingCountStore.getState().upReadingCount(-1)
      }
    };
    return pc;
  });
  return pcs;
}
export function getPC(chainId: number, index?: number) {
  if (!pcMaps[chainId]) {
    pcMaps[chainId] = { pcs: createPCS(chainId), next: 0, time: 0 };
  }
  const item = pcMaps[chainId];
  if (typeof index == "number") {
    item.time = Date.now();
    return item.pcs[index % item.pcs.length];
  } else {
    const nowTime = Date.now();
    if (item.pcs.length > 1 && nowTime - item.time > apiBatchConfig.wait) {
      item.next++;
      if (item.next >= item.pcs.length) item.next = 0;
      item.time = nowTime;
    }
    const pc = item.pcs[item.next];
    return pc;
  }
}
