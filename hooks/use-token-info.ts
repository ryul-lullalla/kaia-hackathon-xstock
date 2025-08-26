"use client";

import { useReadContract, Config } from "wagmi";
import { formatUnits } from "viem";
import { useMemo } from "react";
import { kxStockContract, mockUsdtContract } from "@/lib/contracts";

// Enhanced token info type
export interface TokenInfo {
  balance: bigint;
  symbol: string;
  decimals: number;
  formattedBalance: string;
}

// Enhanced token info hooks with memoization
export function useTokenInfo(tokenAddress: string, userAddress?: string) {
  // Get balance
  const { data: balance, ...balanceRest } = useReadContract<
    typeof kxStockContract.abi,
    "balanceOf",
    [string],
    Config,
    bigint
  >({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get symbol
  const { data: symbol } = useReadContract<
    typeof kxStockContract.abi,
    "symbol",
    [],
    Config,
    string
  >({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "symbol",
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Get decimals
  const { data: decimals } = useReadContract<
    typeof kxStockContract.abi,
    "decimals",
    [],
    Config,
    number
  >({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Memoize the token info object to prevent unnecessary re-renders
  const tokenInfo = useMemo((): TokenInfo => {
    const formattedBalance =
      balance && decimals ? formatUnits(balance, decimals) : "0";

    return {
      balance: balance || BigInt(0),
      symbol: symbol || "",
      decimals: decimals || 18,
      formattedBalance,
    };
  }, [balance, symbol, decimals]);

  return {
    data: tokenInfo,
    ...balanceRest,
  };
}

export function useUsdtInfo(userAddress?: string) {
  return useTokenInfo(mockUsdtContract.address, userAddress);
}

export function useKxStockInfo(userAddress?: string) {
  return useTokenInfo(kxStockContract.address, userAddress);
}
