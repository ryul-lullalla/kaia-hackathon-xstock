"use client";

import { useReadContract, useWriteContract, Config } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useMemo, useCallback } from "react";
import { collateralVaultContract, mockUsdtContract } from "@/lib/contracts";
import { useUsdtInfo } from "./use-token-info";

// Enhanced Collateral Vault hooks
export function useCollateralInfo(userAddress?: string) {
  // Get collateral balance (shares)
  const { data: shares, ...sharesRest } = useReadContract<
    typeof collateralVaultContract.abi,
    "balanceOf",
    [string],
    Config,
    bigint
  >({
    ...collateralVaultContract,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Get underlying USDT token info
  const usdtInfo = useUsdtInfo(userAddress);

  // Memoize the collateral info to prevent unnecessary re-renders
  const collateralInfo = useMemo(
    () => ({
      shares: shares || BigInt(0),
      underlyingToken: usdtInfo.data,
      formattedShares: shares ? formatUnits(shares, 18) : "0",
    }),
    [shares, usdtInfo.data]
  );

  return {
    data: collateralInfo,
    ...sharesRest,
  };
}

// Collateral Vault hooks (keeping for backward compatibility)
export function useCollateralBalance(userAddress?: string) {
  return useReadContract<
    typeof collateralVaultContract.abi,
    "balanceOf",
    [string],
    Config,
    bigint
  >({
    ...collateralVaultContract,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });
}

export function useCollateralDeposit() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const deposit = useCallback(
    (amount: string, onBehalfOf: string) => {
      const amountWei = parseUnits(amount, 18);
      return writeContractAsync({
        ...collateralVaultContract,
        functionName: "deposit",
        args: [amountWei, onBehalfOf],
      });
    },
    [writeContractAsync]
  );

  return { deposit, hash, isPending };
}

export function useCollateralWithdraw() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const withdraw = useCallback(
    (amount: string, to: string) => {
      const amountWei = parseUnits(amount, 18);
      return writeContractAsync({
        ...collateralVaultContract,
        functionName: "withdraw",
        args: [amountWei, to],
      });
    },
    [writeContractAsync]
  );

  return { withdraw, hash, isPending };
}

// Get total collateral deposited in the vault
export function useCollateralTotalSupply() {
  // This represents the total amount of collateral (USDT) deposited in the vault
  // We can get this by checking the USDT balance of the collateral vault contract
  return useReadContract<
    typeof mockUsdtContract.abi,
    "balanceOf",
    [string],
    Config,
    bigint
  >({
    address: mockUsdtContract.address as `0x${string}`,
    abi: mockUsdtContract.abi,
    functionName: "balanceOf",
    args: [collateralVaultContract.address],
  });
}
