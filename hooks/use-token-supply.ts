"use client";

import { useReadContract, Config } from "wagmi";
import { formatUnits } from "viem";
import { useMemo } from "react";
import { kxStockContract, mockUsdtContract } from "@/lib/contracts";

// Enhanced Total Supply hooks with memoization
export function useTokenTotalSupplyInfo(tokenAddress: string) {
  // Get total supply
  const { data: totalSupply, ...totalSupplyRest } = useReadContract<
    typeof kxStockContract.abi,
    "totalSupply",
    [],
    Config,
    bigint
  >({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "totalSupply",
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
  });

  // Memoize the total supply info
  const totalSupplyInfo = useMemo(() => {
    const formattedTotalSupply =
      totalSupply && decimals ? formatUnits(totalSupply, decimals) : "0";

    return {
      totalSupply: totalSupply || BigInt(0),
      symbol: symbol || "",
      decimals: decimals || 18,
      formattedTotalSupply,
    };
  }, [totalSupply, symbol, decimals]);

  return {
    data: totalSupplyInfo,
    ...totalSupplyRest,
  };
}

export function useUsdtTotalSupplyInfo() {
  return useTokenTotalSupplyInfo(mockUsdtContract.address);
}

export function useKxStockTotalSupplyInfo() {
  return useTokenTotalSupplyInfo(kxStockContract.address);
}
