"use client";

import { useReadContracts, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useMemo } from "react";
import { kxStockContract, lendingVaultContract } from "@/lib/contracts";
import { SafeMath } from "@/lib/utils";
import Big from "big.js";

// Pure calculation functions
/**
 * Calculate utilization rate as percentage
 */
function calculateUtilizationRate(
  totalBorrows: bigint,
  totalAssets: bigint
): number {
  if (!SafeMath.greaterThan(totalAssets, 0)) {
    return 0;
  }

  const utilizationRateCalc = SafeMath.divide(
    SafeMath.multiply(totalBorrows, 10000),
    totalAssets
  );
  return SafeMath.toNumber(utilizationRateCalc) / 100;
}

/**
 * Calculate utilization rate in E18 format for precise calculations
 */
function calculateUtilizationRateE18(
  totalBorrows: bigint,
  totalAssets: bigint
): Big {
  if (!SafeMath.greaterThan(totalAssets, 0)) {
    return new Big(0);
  }

  return SafeMath.divide(
    SafeMath.multiply(totalBorrows, SafeMath.power(10, 18)),
    totalAssets || "1"
  );
}

/**
 * Calculate borrow rate per second before optimal utilization
 */
function calculateBorrowRateBeforeOptimal(
  utilizationRateE18: Big,
  baseRatePerSecond: bigint,
  slope1PerSecond: bigint,
  optimalUtilization: bigint
): bigint {
  const interestComponent = SafeMath.divide(
    SafeMath.multiply(utilizationRateE18, slope1PerSecond),
    optimalUtilization
  );
  const borrowRate = SafeMath.add(baseRatePerSecond, interestComponent);
  return BigInt(SafeMath.toString(borrowRate, 0));
}

/**
 * Calculate borrow rate per second after optimal utilization
 */
function calculateBorrowRateAfterOptimal(
  utilizationRateE18: Big,
  baseRatePerSecond: bigint,
  slope1PerSecond: bigint,
  slope2PerSecond: bigint,
  optimalUtilization: bigint
): bigint {
  const excessUtilization = SafeMath.subtract(
    utilizationRateE18,
    optimalUtilization
  );
  const maxExcessUtilization = SafeMath.subtract(
    SafeMath.power(10, 18),
    optimalUtilization
  );

  const excessInterestComponent = SafeMath.divide(
    SafeMath.multiply(excessUtilization, slope2PerSecond),
    maxExcessUtilization
  );
  const borrowRate = SafeMath.add(
    SafeMath.add(baseRatePerSecond, slope1PerSecond),
    excessInterestComponent
  );
  return BigInt(SafeMath.toString(borrowRate, 0));
}

/**
 * Calculate borrow rate per second using AAVE model
 */
function calculateBorrowRatePerSecond(
  utilizationRateE18: Big,
  baseRatePerSecond: bigint,
  slope1PerSecond: bigint,
  slope2PerSecond: bigint,
  optimalUtilization: bigint
): bigint {
  if (SafeMath.lessThanOrEqual(utilizationRateE18, optimalUtilization)) {
    return calculateBorrowRateBeforeOptimal(
      utilizationRateE18,
      baseRatePerSecond,
      slope1PerSecond,
      optimalUtilization
    );
  } else {
    return calculateBorrowRateAfterOptimal(
      utilizationRateE18,
      baseRatePerSecond,
      slope1PerSecond,
      slope2PerSecond,
      optimalUtilization
    );
  }
}

/**
 * Calculate supply rate per second: borrowRate * utilization
 */
function calculateSupplyRatePerSecond(
  borrowRatePerSecond: bigint,
  utilizationRateE18: Big,
  totalAssets: bigint
): bigint {
  if (!SafeMath.greaterThan(totalAssets, 0)) {
    return BigInt(0);
  }

  return BigInt(
    SafeMath.toString(
      SafeMath.divide(
        SafeMath.multiply(borrowRatePerSecond, utilizationRateE18),
        SafeMath.power(10, 18)
      ),
      0
    )
  );
}

/**
 * Calculate APY from rate per second using continuous compounding approximation
 */
function calculateAPY(ratePerSecond: bigint, secondsPerYear: bigint): number {
  if (
    !SafeMath.greaterThan(ratePerSecond, 0) ||
    !SafeMath.greaterThan(secondsPerYear, 0)
  ) {
    return 0;
  }

  const ratePerSecondDecimal = SafeMath.divide(
    ratePerSecond,
    SafeMath.power(10, 18)
  );
  const secondsPerYearNumber = SafeMath.toNumber(secondsPerYear);

  if (!SafeMath.greaterThan(ratePerSecondDecimal, 0)) {
    return 0;
  }

  const annualRate = SafeMath.multiply(
    ratePerSecondDecimal,
    secondsPerYearNumber
  );

  if (SafeMath.lessThan(annualRate, 0.1)) {
    // For rates < 10%, simple approximation is accurate enough
    return SafeMath.toNumber(SafeMath.multiply(annualRate, 100));
  } else {
    // Use JavaScript's Math.exp for larger rates
    const annualRateNumber = SafeMath.toNumber(annualRate);
    return (Math.exp(annualRateNumber) - 1) * 100;
  }
}

// Types for market data
export interface MarketData {
  // Raw values from contract
  borrowCap: bigint;
  totalAssets: bigint;
  totalBorrows: bigint;
  totalSupply: bigint;
  baseRatePerSecond: bigint;
  slope1PerSecond: bigint;
  slope2PerSecond: bigint;
  optimalUtilization: bigint;
  secondsPerYear: bigint;
  borrowIndex: bigint;
  lastAccrual: bigint;
  maxDeposit: bigint;
  maxWithdraw: bigint;
  maxRedeem: bigint;

  // Calculated values
  utilizationRate: number; // Percentage (0-100)
  borrowRatePerSecond: bigint;
  supplyRatePerSecond: bigint;
  borrowAPY: number; // Percentage (0-100)
  supplyAPY: number; // Percentage (0-100)

  // Formatted values
  formattedborrowCap: string;
  formattedTotalAssets: string;
  formattedTotalBorrows: string;
  formattedTotalSupply: string;
  formattedUtilizationRate: string;
  formattedBorrowAPY: string;
  formattedSupplyAPY: string;
  formattedMaxDeposit: string;
  formattedMaxWithdraw: string;
  formattedMaxRedeem: string;

  // Loading and error states
  isLoading: boolean;
  error?: string;
}

export interface UserMarketData {
  // User-specific data
  userSuppliedAssets: bigint;
  userBorrowedAssets: bigint;
  userCollateralAmount: bigint;
  userCollateralValueE18: bigint;
  userDebtValueE18: bigint;
  isHealthy: boolean;

  // Formatted user data
  formattedUserSuppliedAssets: string;
  formattedUserBorrowedAssets: string;
  formattedUserCollateralAmount: string;
  formattedUserCollateralValueE18: string;
  formattedUserDebtValueE18: string;
}

/**
 * Hook to fetch and calculate market data including APY calculations
 * Based on AAVE interest rate model with utilization-based rates
 */
export function useMarketData() {
  // Define all the contract calls we need for market data
  const contractCalls = [
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
      functionName: "baseRatePerSecond",
    },
    {
      ...lendingVaultContract,
      functionName: "slope1PerSecond",
    },
    {
      ...lendingVaultContract,
      functionName: "slope2PerSecond",
    },
    {
      ...lendingVaultContract,
      functionName: "optimalUtilization",
    },
    {
      ...lendingVaultContract,
      functionName: "SECONDS_PER_YEAR",
    },
    {
      ...lendingVaultContract,
      functionName: "borrowIndex",
    },
    {
      ...lendingVaultContract,
      functionName: "lastAccrual",
    },
    {
      ...lendingVaultContract,
      functionName: "maxDeposit",
      args: [kxStockContract.address],
    },
    {
      ...lendingVaultContract,
      functionName: "maxWithdraw",
      args: [kxStockContract.address],
    },
    {
      ...lendingVaultContract,
      functionName: "maxRedeem",
      args: [kxStockContract.address],
    },
  ] as const;

  // Batch all contract calls
  const {
    data: contractResults,
    isLoading,
    error,
    refetch,
  } = useReadContracts({
    contracts: contractCalls,
  });
  console.log({ contractResults });

  // Calculate market data using useMemo for performance
  const marketData = useMemo((): MarketData => {
    if (
      !contractResults ||
      contractResults.some((result) => result.status !== "success")
    ) {
      return {
        borrowCap: BigInt(0),
        totalAssets: BigInt(0),
        totalBorrows: BigInt(0),
        totalSupply: BigInt(0),
        maxDeposit: BigInt(0),
        maxWithdraw: BigInt(0),
        maxRedeem: BigInt(0),
        baseRatePerSecond: BigInt(0),
        slope1PerSecond: BigInt(0),
        slope2PerSecond: BigInt(0),
        optimalUtilization: BigInt(0),
        secondsPerYear: BigInt(31536000), // Default value
        borrowIndex: BigInt(0),
        lastAccrual: BigInt(0),
        utilizationRate: 0,
        borrowRatePerSecond: BigInt(0),
        supplyRatePerSecond: BigInt(0),
        borrowAPY: 0,
        supplyAPY: 0,
        formattedborrowCap: "0",
        formattedTotalAssets: "0",
        formattedTotalBorrows: "0",
        formattedTotalSupply: "0",
        formattedUtilizationRate: "0",
        formattedBorrowAPY: "0",
        formattedSupplyAPY: "0",
        formattedMaxDeposit: "0",
        formattedMaxWithdraw: "0",
        formattedMaxRedeem: "0",
        isLoading,
        error: error?.message,
      };
    }

    // Extract results
    const [
      borrowCapResult,
      totalAssetsResult,
      totalBorrowsResult,
      totalSupplyResult,
      baseRatePerSecondResult,
      slope1PerSecondResult,
      slope2PerSecondResult,
      optimalUtilizationResult,
      secondsPerYearResult,
      borrowIndexResult,
      lastAccrualResult,
      maxDepositResult,
      maxWithdrawResult,
      maxRedeemResult,
    ] = contractResults;

    const borrowCap = borrowCapResult.result as bigint;
    const totalAssets = totalAssetsResult.result as bigint;
    const totalBorrows = totalBorrowsResult.result as bigint;
    const totalSupply = totalSupplyResult.result as bigint;

    const baseRatePerSecond = baseRatePerSecondResult.result as bigint;
    const slope1PerSecond = slope1PerSecondResult.result as bigint;
    const slope2PerSecond = slope2PerSecondResult.result as bigint;
    const optimalUtilization = optimalUtilizationResult.result as bigint;
    const secondsPerYear = secondsPerYearResult.result as bigint;
    const borrowIndex = borrowIndexResult.result as bigint;
    const lastAccrual = lastAccrualResult.result as bigint;
    const maxDeposit = maxDepositResult?.result as bigint;
    const maxWithdraw = maxWithdrawResult?.result as bigint;
    const maxRedeem = maxRedeemResult?.result as bigint;

    // Calculate all market metrics using pure functions
    const utilizationRate = calculateUtilizationRate(totalBorrows, totalAssets);
    const utilizationRateE18 = calculateUtilizationRateE18(
      totalBorrows,
      totalAssets
    );

    const borrowRatePerSecond = calculateBorrowRatePerSecond(
      utilizationRateE18,
      baseRatePerSecond,
      slope1PerSecond,
      slope2PerSecond,
      optimalUtilization
    );

    const supplyRatePerSecond = calculateSupplyRatePerSecond(
      borrowRatePerSecond,
      utilizationRateE18,
      totalAssets
    );

    const borrowAPY = calculateAPY(borrowRatePerSecond, secondsPerYear);
    const supplyAPY = calculateAPY(supplyRatePerSecond, secondsPerYear);

    return {
      borrowCap,
      totalAssets,
      totalBorrows,
      totalSupply,
      baseRatePerSecond,
      slope1PerSecond,
      slope2PerSecond,
      optimalUtilization,
      secondsPerYear,
      borrowIndex,
      lastAccrual,
      utilizationRate,
      borrowRatePerSecond,
      supplyRatePerSecond,
      borrowAPY,
      supplyAPY,
      maxDeposit,
      maxWithdraw,
      maxRedeem,
      formattedborrowCap: formatUnits(borrowCap, 18),
      formattedTotalAssets: formatUnits(totalAssets, 18),
      formattedTotalBorrows: formatUnits(totalBorrows, 18),
      formattedTotalSupply: formatUnits(totalSupply, 18),
      formattedUtilizationRate: utilizationRate.toFixed(2),
      formattedBorrowAPY: borrowAPY.toFixed(2),
      formattedSupplyAPY: supplyAPY.toFixed(2),
      formattedMaxDeposit: maxDeposit ? formatUnits(maxDeposit, 18) : "0",
      formattedMaxWithdraw: maxWithdraw ? formatUnits(maxWithdraw, 18) : "0",
      formattedMaxRedeem: maxRedeem ? formatUnits(maxRedeem, 18) : "0",
      isLoading,
      error: error?.message,
    };
  }, [contractResults, isLoading, error]);

  return { marketData, refetch };
}

/**
 * Hook to fetch user-specific market data
 */
export function useUserMarketData(userAddress?: string) {
  // Define user-specific contract calls
  const userContractCalls = userAddress
    ? [
        {
          ...lendingVaultContract,
          functionName: "assetsOf",
          args: [userAddress],
        },
        {
          ...lendingVaultContract,
          functionName: "debtOf",
          args: [userAddress],
        },
        {
          ...lendingVaultContract,
          functionName: "collateralAmount",
          args: [userAddress],
        },
        {
          ...lendingVaultContract,
          functionName: "collateralValueE18",
          args: [userAddress],
        },
        {
          ...lendingVaultContract,
          functionName: "debtValueE18",
          args: [userAddress],
        },
        {
          ...lendingVaultContract,
          functionName: "isHealthy",
          args: [userAddress],
        },
      ]
    : [];

  const { data: userResults, refetch } = useReadContracts({
    contracts: userContractCalls as any,
    query: {
      enabled: !!userAddress,
    },
  });

  const userData = useMemo((): UserMarketData | null => {
    if (
      !userAddress ||
      !userResults ||
      userResults.some((result) => result.result === undefined)
    ) {
      return null;
    }

    const [
      userSuppliedAssetsResult,
      userBorrowedAssetsResult,
      userCollateralAmountResult,
      userCollateralValueE18Result,
      userDebtValueE18Result,
      isHealthyResult,
      maxDepositResult,
      maxWithdrawResult,
      maxRedeemResult,
    ] = userResults;

    const userSuppliedAssets = userSuppliedAssetsResult.result as bigint;
    const userBorrowedAssets = userBorrowedAssetsResult.result as bigint;
    const userCollateralAmount = userCollateralAmountResult.result as bigint;
    const userCollateralValueE18 =
      userCollateralValueE18Result.result as bigint;
    const userDebtValueE18 = userDebtValueE18Result.result as bigint;
    const isHealthy = isHealthyResult.result as boolean;
    const maxDeposit = maxDepositResult?.result as bigint | undefined;
    const maxWithdraw = maxWithdrawResult?.result as bigint | undefined;
    const maxRedeem = maxRedeemResult?.result as bigint | undefined;

    return {
      userSuppliedAssets,
      userBorrowedAssets,
      userCollateralAmount,
      userCollateralValueE18,
      userDebtValueE18,
      isHealthy,
      formattedUserSuppliedAssets: formatUnits(userSuppliedAssets, 18),
      formattedUserBorrowedAssets: formatUnits(userBorrowedAssets, 18),
      formattedUserCollateralAmount: formatUnits(userCollateralAmount, 18),
      formattedUserCollateralValueE18: formatUnits(userCollateralValueE18, 18),
      formattedUserDebtValueE18: formatUnits(userDebtValueE18, 18),
    };
  }, [userAddress, userResults]);

  // return userData
  return { userData, refetch };
}

/**
 * Combined hook that returns both market data and user data
 */
export function useCompleteMarketData(userAddress?: string) {
  const marketData = useMarketData();
  const userData = useUserMarketData(userAddress);

  const refetch = () => {
    marketData.refetch();
    userData.refetch();
  };

  return {
    marketData: marketData.marketData,
    userData: userData?.userData,
    refetchCompleteMarketData: refetch,
    isLoading: marketData.marketData.isLoading,
    error: marketData.marketData.error,
  };
}
