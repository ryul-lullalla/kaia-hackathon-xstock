"use client";

import { useReadContract, useWriteContract, Config, useAccount } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { useMemo } from "react";
import { kxStockContract } from "@/lib/contracts";
import { waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/lib/wagmi";

// Token approval hooks with memoization
export function useTokenApproval() {
  const { address } = useAccount();
  const {
    // writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  // Memoize the approve function to prevent re-creation
  const approve = useMemo(
    () => async (tokenAddress: string, spender: string) => {
      const amountWei = parseUnits("100", 18);
      // Use unlimited approval (max uint256 value)
      const approvalResult = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: kxStockContract.abi,
        functionName: "approve",
        // args: [spender, parseUnits("0", 18)],
        args: [spender, maxUint256],
      });

      return approvalResult;
    },
    [writeContractAsync]
  );

  return { approve, hash, isPending, error };
}

// Token allowance hook
export function useTokenAllowance(
  tokenAddress?: string,
  owner?: string,
  spender?: string
) {
  const { data: allowance, ...rest } = useReadContract<
    typeof kxStockContract.abi,
    "allowance",
    [string, string],
    Config,
    bigint
  >({
    address: tokenAddress as `0x${string}`,
    abi: kxStockContract.abi,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!(tokenAddress && owner && spender),
    },
  });

  return { data: allowance || BigInt(0), ...rest };
}
