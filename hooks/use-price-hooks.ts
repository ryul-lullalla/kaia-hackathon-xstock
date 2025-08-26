"use client";

import { useReadContract, Config } from "wagmi";
import { formatUnits } from "viem";
import { useMemo } from "react";
import { simplePriceOracleContract, mockUsdtContract, kxStockContract } from "@/lib/contracts";

// Enhanced token price info with formatting
export interface TokenPriceInfo {
  price: bigint;
  formattedPrice: string;
  tokenAddress: string;
}

// Price Oracle hooks
export function useTokenPrice(tokenAddress?: string) {
  return useReadContract<
    typeof simplePriceOracleContract.abi,
    "getPrice",
    [string],
    Config,
    bigint
  >({
    ...simplePriceOracleContract,
    functionName: "getPrice",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

export function useTokenPriceInfo(tokenAddress?: string) {
  const { data: price, ...priceRest } = useTokenPrice(tokenAddress);

  // Memoize the token price info to prevent unnecessary re-renders
  const tokenPriceInfo = useMemo((): TokenPriceInfo => ({
    price: price || BigInt(0),
    formattedPrice: price ? formatUnits(price, 18) : "0",
    tokenAddress: tokenAddress || "",
  }), [price, tokenAddress]);

  return {
    data: tokenPriceInfo,
    ...priceRest,
  };
}

// Specific token price hooks for convenience
export function useUsdtPrice() {
  const { data, ...restTokenPriceInfo } = useTokenPrice(
    mockUsdtContract.address
  );
  
  // Memoize the formatted price
  const formattedPrice = useMemo(() => 
    formatUnits(data || BigInt(0), 18), 
    [data]
  );

  return {
    data: formattedPrice,
    ...restTokenPriceInfo,
  };
}

export function useKxStockPrice() {
  const { data, ...restTokenPriceInfo } = useTokenPrice(
    kxStockContract.address
  );
  
  // Memoize the formatted price
  const formattedPrice = useMemo(() => 
    formatUnits(data || BigInt(0), 18), 
    [data]
  );

  return {
    data: formattedPrice,
    ...restTokenPriceInfo,
  };
}

export function useUsdtPriceInfo() {
  return useTokenPriceInfo(mockUsdtContract.address);
}

export function useKxStockPriceInfo() {
  return useTokenPriceInfo(kxStockContract.address);
}
