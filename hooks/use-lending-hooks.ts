"use client";

import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  Config,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useMemo, useCallback } from "react";
import { lendingVaultContract } from "@/lib/contracts";
import { useUsdtInfo } from "@/hooks/use-token-info";

// Enhanced lending vault info
export function useLendingVaultInfo(userAddress?: string) {
  // Get lending vault balance (shares)
  const { data: shares, ...sharesRest } = useReadContract<
    typeof lendingVaultContract.abi,
    "balanceOf",
    [string],
    Config,
    bigint
  >({
    ...lendingVaultContract,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Convert shares to underlying assets
  const { data: underlyingAssets } = useReadContract<
    typeof lendingVaultContract.abi,
    "convertToAssets",
    [bigint],
    Config,
    bigint
  >({
    ...lendingVaultContract,
    functionName: "convertToAssets",
    args: shares ? [shares] : undefined,
    query: {
      enabled: !!shares && shares > BigInt(0),
    },
  });

  // Get underlying USDT token info
  const usdtInfo = useUsdtInfo(userAddress);

  // Memoize the return object to prevent unnecessary re-renders
  const lendingInfo = useMemo(
    () => ({
      shares: shares || BigInt(0),
      underlyingAssets: underlyingAssets || BigInt(0),
      underlyingToken: usdtInfo.data,
      formattedShares: shares ? formatUnits(shares, 18) : "0",
      formattedAssets: underlyingAssets
        ? formatUnits(underlyingAssets, 18)
        : "0",
    }),
    [shares, underlyingAssets, usdtInfo.data]
  );

  return {
    data: lendingInfo,
    ...sharesRest,
  };
}

// Lending Vault hooks
export function useLendingDeposit() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const deposit = useCallback(
    (assets: string, receiver: string) => {
      const assetsWei = parseUnits(assets, 18);
      return writeContractAsync({
        ...lendingVaultContract,
        functionName: "deposit",
        args: [assetsWei, receiver],
      });
    },
    [writeContractAsync]
  );

  return { deposit, hash, isPending };
}

export function useLendingWithdraw() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const withdraw = useCallback(
    (assets: string, receiver: string, owner: string) => {
      const assetsWei = parseUnits(assets, 18);
      return writeContractAsync({
        ...lendingVaultContract,
        functionName: "withdraw",
        args: [assetsWei, receiver, owner],
      });
    },
    [writeContractAsync]
  );

  return { withdraw, hash, isPending };
}

export function useBorrow() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const borrow = useCallback(
    (assets: string) => {
      const assetsWei = parseUnits(assets, 18);
      return writeContractAsync({
        ...lendingVaultContract,
        functionName: "borrow",
        args: [assetsWei],
      });
    },
    [writeContractAsync]
  );

  return { borrow, hash, isPending };
}

export function useRepay() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const repay = useCallback(
    (assets: string, onBehalfOf: string) => {
      const assetsWei = parseUnits(assets, 18);
      writeContract({
        ...lendingVaultContract,
        functionName: "repay",
        args: [assetsWei, onBehalfOf],
      });
    },
    [writeContract]
  );

  return { repay, hash, isPending };
}

// Get total assets in lending vault (real supply amount)
export function useLendingVaultTotalAssets() {
  return useReadContract<
    typeof lendingVaultContract.abi,
    "totalAssets",
    [],
    Config,
    bigint
  >({
    ...lendingVaultContract,
    functionName: "totalAssets",
  });
}

// Get total shares in lending vault
export function useLendingVaultTotalSupply() {
  return useReadContract<
    typeof lendingVaultContract.abi,
    "totalSupply",
    [],
    Config,
    bigint
  >({
    ...lendingVaultContract,
    functionName: "totalSupply",
  });
}

// Enhanced lending vault total info with memoization
export function useLendingVaultTotalInfo() {
  const { data: totalAssets, ...assetsRest } = useLendingVaultTotalAssets();
  const { data: totalSupply } = useLendingVaultTotalSupply();

  const totalInfo = useMemo(
    () => ({
      totalAssets: totalAssets || BigInt(0),
      totalSupply: totalSupply || BigInt(0),
      formattedTotalAssets: totalAssets ? formatUnits(totalAssets, 18) : "0",
      formattedTotalSupply: totalSupply ? formatUnits(totalSupply, 18) : "0",
    }),
    [totalAssets, totalSupply]
  );

  return {
    data: totalInfo,
    ...assetsRest,
  };
}

// Enhanced Lending Vault View Functions Hook
export interface LendingVaultViewData {
  borrowCap: bigint;
  debtOf: bigint;
  balanceOf: bigint;
  assetsOf: bigint;
  collateralAmount: bigint;
  maxDeposit: bigint;
  maxWithdraw: bigint;
  maxRedeem: bigint;
  totalAssets: bigint;
  totalBorrows: bigint;
  totalSupply: bigint;
  minCash: bigint;
  // Formatted values for display
  formattedBorrowCap: string;
  formattedDebtOf: string;
  formattedBalanceOf: string;
  formattedAssetsOf: string;
  formattedCollateralAmount: string;
  formattedMaxDeposit: string;
  formattedMaxWithdraw: string;
  formattedMaxRedeem: string;
  formattedTotalAssets: string;
  formattedTotalBorrows: string;
  formattedTotalSupply: string;
  formattedMinCash: string;
}

export function useLendingVaultViewFunctions(userAddress?: string) {
  // Memoize contract calls to prevent unnecessary re-creation
  const contractCalls = useMemo(() => {
    const baseCalls = [
      // Global view functions (no user address required)
      {
        ...lendingVaultContract,
        functionName: "borrowCap",
      },
      {
        ...lendingVaultContract,
        functionName: "totalAssets",
      },
      {
        ...lendingVaultContract,
        functionName: "totalBorrows",
      },
      {
        ...lendingVaultContract,
        functionName: "totalSupply",
      },
      {
        ...lendingVaultContract,
        functionName: "minCash",
      },
    ];

    // User-specific view functions (require user address)
    const userCalls = userAddress
      ? [
          {
            ...lendingVaultContract,
            functionName: "debtOf",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "balanceOf",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "assetsOf",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "collateralAmount",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "maxDeposit",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "maxWithdraw",
            args: [userAddress],
          },
          {
            ...lendingVaultContract,
            functionName: "maxRedeem",
            args: [userAddress],
          },
        ]
      : [];

    return [...baseCalls, ...userCalls] as const;
  }, [userAddress]);

  // Use useReadContracts to batch all calls
  const { data: contractResults } = useReadContracts({
    contracts: contractCalls as any,
  });

  // Memoize the view data calculation
  const viewData = useMemo((): LendingVaultViewData => {
    // Extract results with proper indexing
    const [
      borrowCapResult,
      totalAssetsResult,
      totalBorrowsResult,
      totalSupplyResult,
      minCashResult,
      debtOfResult,
      balanceOfResult,
      assetsOfResult,
      collateralAmountResult,
      maxDepositResult,
      maxWithdrawResult,
      maxRedeemResult,
    ] = contractResults || [];

    // Extract the actual values
    const borrowCap = borrowCapResult?.result as bigint | undefined;
    const totalAssets = totalAssetsResult?.result as bigint | undefined;
    const totalBorrows = totalBorrowsResult?.result as bigint | undefined;
    const totalSupply = totalSupplyResult?.result as bigint | undefined;
    const minCash = minCashResult?.result as bigint | undefined;
    const debtOf = debtOfResult?.result as bigint | undefined;
    const balanceOf = balanceOfResult?.result as bigint | undefined;
    const assetsOf = assetsOfResult?.result as bigint | undefined;
    const collateralAmount = collateralAmountResult?.result as
      | bigint
      | undefined;
    const maxDeposit = maxDepositResult?.result as bigint | undefined;
    const maxWithdraw = maxWithdrawResult?.result as bigint | undefined;
    const maxRedeem = maxRedeemResult?.result as bigint | undefined;

    return {
      borrowCap: borrowCap || BigInt(0),
      debtOf: debtOf || BigInt(0),
      balanceOf: balanceOf || BigInt(0),
      assetsOf: assetsOf || BigInt(0),
      collateralAmount: collateralAmount || BigInt(0),
      maxDeposit: maxDeposit || BigInt(0),
      maxWithdraw: maxWithdraw || BigInt(0),
      maxRedeem: maxRedeem || BigInt(0),
      totalAssets: totalAssets || BigInt(0),
      totalBorrows: totalBorrows || BigInt(0),
      totalSupply: totalSupply || BigInt(0),
      minCash: minCash || BigInt(0),
      // Formatted values (assuming 18 decimals for USDT)
      formattedBorrowCap: borrowCap ? formatUnits(borrowCap, 18) : "0",
      formattedDebtOf: debtOf ? formatUnits(debtOf, 18) : "0",
      formattedBalanceOf: balanceOf ? formatUnits(balanceOf, 18) : "0",
      formattedAssetsOf: assetsOf ? formatUnits(assetsOf, 18) : "0",
      formattedCollateralAmount: collateralAmount
        ? formatUnits(collateralAmount, 18)
        : "0",
      formattedMaxDeposit: maxDeposit ? formatUnits(maxDeposit, 18) : "0",
      formattedMaxWithdraw: maxWithdraw ? formatUnits(maxWithdraw, 18) : "0",
      formattedMaxRedeem: maxRedeem ? formatUnits(maxRedeem, 18) : "0",
      formattedTotalAssets: totalAssets ? formatUnits(totalAssets, 18) : "0",
      formattedTotalBorrows: totalBorrows ? formatUnits(totalBorrows, 18) : "0",
      formattedTotalSupply: totalSupply ? formatUnits(totalSupply, 18) : "0",
      formattedMinCash: minCash ? formatUnits(minCash, 18) : "0",
    };
  }, [contractResults]);

  return viewData;
}

// Transaction receipt hook
export function useTransactionReceipt(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });
}
