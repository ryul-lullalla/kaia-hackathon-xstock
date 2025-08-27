import { CONTRACTS } from "./config";

// Import ABIs
import CollateralVaultABI from "../abis/CollateralVault.json";
import KXStockABI from "../abis/KXStock.json";
import LendingVaultABI from "../abis/LendingVault.json";
import SimplePriceOracleABI from "../abis/SimplePriceOracle.json";
import { KXStockABI as KXStockABI2 } from "../abis/abis";

// Contract configurations for wagmi
export const collateralVaultContract = {
  address: CONTRACTS.COLLATERAL_VAULT,
  abi: CollateralVaultABI.abi,
} as const;
// } as const;

export const kxStockContract = {
  address: CONTRACTS.KX_APPLE,
  abi: KXStockABI.abi,
} as const;

export const lendingVaultContract = {
  address: CONTRACTS.LENDING_VAULT,
  abi: LendingVaultABI.abi,
} as const;

export const mockUsdtContract = {
  address: CONTRACTS.MOCK_USDT,
  abi: KXStockABI.abi, // Using same ERC20 ABI for USDT
} as const;

export const simplePriceOracleContract = {
  address: CONTRACTS.PRICE_ORACLE,
  abi: SimplePriceOracleABI.abi,
} as const;

// Token information
export const TOKENS = {
  USDT: {
    address: CONTRACTS.MOCK_USDT,
    symbol: "USDT",
    name: "Mock USDT",
    decimals: 18,
  },
  KXAPPLE: {
    address: CONTRACTS.KX_APPLE,
    symbol: "kxApple",
    name: "Kaia xStock APPL",
    decimals: 18,
  },
} as const;
