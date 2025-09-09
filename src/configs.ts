import { parseAbi, type Address, type Chain } from "viem";
import { bsc, bscTestnet } from "viem/chains";

export const SUPPORT_CHAINS = [bsc, bscTestnet] as const;

export const apiBatchConfig = { batchSize: 30, wait: 300 };
export const multicallBatchConfig = { batchSize: 1024, wait: 500 };

export type MaConfig = {
  chain: Chain;
  stake: Address;
  asset: Address;
  assetDecimals: number
};
export const MaConfigs: MaConfig[] = [
  {
    chain: bscTestnet,
    stake: "0x8f55acb3a053a2b14cea7b8825a67537fce623b1",
    asset: "0x3cf4b2d37fa4aa5d9ba34bf79d15103935e58b5d",
    assetDecimals: 18
  },
];

export const abiMaStake = parseAbi([
  `struct StakeRecord {uint256 id;address user;string sn;uint256 amount;uint256 startTimestamp;uint256 endTimestamp;bool unstaked;}`,
  `function stake(uint256 totalAmount, StakeRecord[] memory stakeRecords) external returns (uint256[] memory)`,
  `function unstake(uint256 totalAmount, uint256[] memory stakeIds) external`,
  'function getStakeCount() external view returns (uint256)',
  'function getStakeRecords(uint256 index, uint256 count) external view returns (StakeRecord[] memory)',
  'function getUserStakeCount(address user) external view returns (uint256)',
  'function getUserStakeRecords(address user, uint256 index, uint256 count) external view returns (StakeRecord[] memory)',
  'function updateUnstakeRecipient(address newRecipient) external',
  'function updateMaxStakeSize(uint256 newSize) external',
  'function updateMaxUnstakeSize(uint256 newSize) external',
]);
