"use client";

// Re-export all hooks from separate modules for backward compatibility
// This approach prevents re-rendering issues by separating concerns

// Token-related hooks
export {
  useTokenInfo,
  useUsdtInfo,
  useKxStockInfo,
  type TokenInfo,
} from "./use-token-info";

export { useTokenApproval, useTokenAllowance } from "./use-token-approval";

export {
  useTokenTotalSupplyInfo,
  useUsdtTotalSupplyInfo,
  useKxStockTotalSupplyInfo,
} from "./use-token-supply";

export { useKxStockMint } from "./use-kx-stock-mint";

// Lending-related hooks
export {
  useLendingVaultInfo,
  useLendingDeposit,
  useLendingWithdraw,
  useBorrow,
  useRepay,
  useLendingVaultTotalAssets,
  useLendingVaultTotalSupply,
  useLendingVaultTotalInfo,
  useLendingVaultViewFunctions,
  useTransactionReceipt,
  type LendingVaultViewData,
} from "./use-lending-hooks";

// Collateral-related hooks
export {
  useCollateralInfo,
  useCollateralBalance,
  useCollateralDeposit,
  useCollateralWithdraw,
  useCollateralTotalSupply,
} from "./use-collateral-hooks";

// Price-related hooks
export {
  useTokenPrice,
  useTokenPriceInfo,
  useUsdtPrice,
  useKxStockPrice,
  useUsdtPriceInfo,
  useKxStockPriceInfo,
  type TokenPriceInfo,
} from "./use-price-hooks";

// ========================================
// DEPRECATED HOOKS - Use the new modular hooks instead
// These are kept for backward compatibility only
// ========================================

import { useReadContract } from "wagmi";
import {
  kxStockContract,
  lendingVaultContract,
  mockUsdtContract,
} from "@/lib/contracts";

// Legacy token balance hooks - deprecated
/** @deprecated Use useTokenInfo instead */
export function useTokenBalance(tokenAddress: string, userAddress?: string) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
}

/** @deprecated Use useUsdtInfo instead */
export function useUsdtBalance(userAddress?: string) {
  return useTokenBalance(mockUsdtContract.address, userAddress);
}

/** @deprecated Use useKxStockInfo instead */
export function useKxStockBalance(userAddress?: string) {
  return useTokenBalance(kxStockContract.address, userAddress);
}

// Legacy total supply hooks - deprecated
/** @deprecated Use useUsdtTotalSupplyInfo instead */
export function useUsdtTotalSupply() {
  return useReadContract({
    address: mockUsdtContract.address as `0x${string}`,
    abi: mockUsdtContract.abi,
    functionName: "totalSupply",
  });
}

/** @deprecated Use useKxStockTotalSupplyInfo instead */
export function useKxStockTotalSupply() {
  return useReadContract({
    ...kxStockContract,
    functionName: "totalSupply",
  });
}

// Legacy lending vault hooks - deprecated
/** @deprecated Use useLendingVaultInfo instead */
export function useLendingVaultBalance(userAddress?: string) {
  return useReadContract({
    ...lendingVaultContract,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
}
