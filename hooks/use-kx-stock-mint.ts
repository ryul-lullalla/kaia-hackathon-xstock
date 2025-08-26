"use client";

import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useMemo } from "react";
import { kxStockContract } from "@/lib/contracts";

// KX Stock Faucet hook
export function useKxStockMint() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Memoize the mint function
  const mint = useMemo(
    () => (to: string, amount: string) => {
      const amountWei = parseUnits(amount, 18);
      writeContract({
        ...kxStockContract,
        functionName: "mint",
        args: [to, amountWei],
      });
    },
    [writeContract]
  );

  return { mint, hash, isPending };
}
