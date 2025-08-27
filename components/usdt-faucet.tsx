"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactionReceipt, useTokenBalance } from "@/hooks/use-contracts";
import { useUsdtMint } from "@/hooks/use-usdt-mint";
import { formatTokenAmount } from "@/lib/utils";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";
import { TOKENS } from "@/lib/contracts";

export function UsdtFaucet() {
  const { address: userAddress, isConnected } = useAccount();
  const [amount, setAmount] = useState("100");
  const { data: balance, refetch: refetchBalance } = useTokenBalance(
    TOKENS.USDT.address,
    userAddress
  );
  const { mint, hash, isPending } = useUsdtMint();
  const { isLoading: isConfirming, isSuccess } = useTransactionReceipt(hash);

  const handleMint = async () => {
    if (!userAddress || !amount) return;

    try {
      mint(userAddress, amount);
      toast.info("Transaction submitted", {
        description: "Please confirm the transaction in your wallet",
      });
    } catch (error) {
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Refetch balance when transaction succeeds
  if (isSuccess) {
    refetchBalance();
    toast.success("Tokens minted successfully!", {
      description: `${amount} USDT tokens have been added to your wallet`,
    });
  }

  const isLoading = isPending || isConfirming;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          USDT Faucet
        </CardTitle>
        <CardDescription>
          Get free USDT tokens for testing and collateral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && userAddress && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Your Balance</div>
            <div className="text-lg font-semibold">
              {formatTokenAmount(balance as bigint)} USDT
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            max="1000"
          />
        </div>

        <Button
          onClick={handleMint}
          disabled={!isConnected || !amount || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Confirming..." : "Minting..."}
            </>
          ) : (
            "Mint Tokens"
          )}
        </Button>

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to mint tokens
          </p>
        )}
      </CardContent>
    </Card>
  );
}
