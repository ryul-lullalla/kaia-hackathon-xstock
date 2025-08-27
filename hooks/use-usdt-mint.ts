"use client";

import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useMemo } from "react";
import { mockUsdtContract } from "@/lib/contracts";

// USDT Faucet hook
export function useUsdtMint() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Memoize the mint function
  const mint = useMemo(
    () => (to: string, amount: string) => {
      const amountWei = parseUnits(amount, 18);
      writeContract({
        ...mockUsdtContract,
        functionName: "mint",
        args: [to, amountWei],
      });
    },
    [writeContract]
  );

  return { mint, hash, isPending };
}
