"use client";

import { useState, useEffect } from "react";
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
import {
  useUsdtBalance,
  useCollateralBalance,
  useCollateralDeposit,
  useCollateralWithdraw,
  useTokenApproval,
  useTokenAllowance,
  useTransactionReceipt,
  useUsdtTotalSupply,
  useCollateralTotalSupply,
} from "@/hooks/use-contracts";
import { formatTokenAmount } from "@/lib/utils";
import { CONTRACTS } from "@/lib/config";
import { toast } from "sonner";
import { Shield, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/lib/wagmi";

export function CollateralSupply() {
  const { address: userAddress, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(true);

  const { data: usdtBalance, refetch: refetchUsdtBalance } =
    useUsdtBalance(userAddress);
  const { data: collateralBalance, refetch: refetchCollateralBalance } =
    useCollateralBalance(userAddress);

  // Total supply data
  const { data: usdtTotalSupply } = useUsdtTotalSupply();
  const { data: collateralTotalSupply } = useCollateralTotalSupply();

  // Check USDT allowance for CollateralVault
  const { data: usdtAllowance, refetch: refetchAllowance } = useTokenAllowance(
    CONTRACTS.MOCK_USDT,
    userAddress,
    CONTRACTS.COLLATERAL_VAULT
  );

  const {
    approve,
    hash: approveHash,
    isPending: isApproving,
  } = useTokenApproval();
  const {
    deposit,
    hash: depositHash,
    isPending: isDepositPending,
  } = useCollateralDeposit();
  const {
    withdraw,
    hash: withdrawHash,
    isPending: isWithdrawing,
  } = useCollateralWithdraw();

  const { isSuccess: isApproveSuccess } = useTransactionReceipt(approveHash);
  const { isSuccess: isDepositSuccess } = useTransactionReceipt(depositHash);
  const { isSuccess: isWithdrawSuccess } = useTransactionReceipt(withdrawHash);

  const handleApprove = async () => {
    if (!userAddress || !amount) return;

    try {
      approve(CONTRACTS.MOCK_USDT, CONTRACTS.COLLATERAL_VAULT);
      toast.info("Approval submitted", {
        description: "Please confirm the approval transaction",
      });
    } catch (error) {
      toast.error("Approval failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDeposit = async () => {
    if (!userAddress || !amount) return;

    try {
      const result = await deposit(amount, userAddress);
      if (!!result) {
        toast.info("Deposit submitted");
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });

        if (!!receipt) {
          toast.success("Deposit Success!");
          refetchUsdtBalance();
          refetchCollateralBalance();
          setAmount("");
        }
      }
    } catch (error) {
      toast.error("Deposit failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!userAddress || !amount) return;

    try {
      const result = await withdraw(amount, userAddress);
      if (!!result) {
        toast.info("Withdrawal submitted");
      }
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: result,
      });

      if (!!receipt) {
        toast.success("Withdrawal Success!");
        refetchUsdtBalance();
        refetchCollateralBalance();
        setAmount("");
      }
    } catch (error) {
      toast.error("Withdrawal failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Check if approval is needed (allowance is less than the amount to deposit)
  const amountWei = amount ? BigInt(parseFloat(amount) * 1e18) : BigInt(0);
  const needsApproval =
    isDepositing &&
    usdtAllowance < amountWei &&
    amount &&
    parseFloat(amount) > 0;

  // Handle transaction success
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      toast.success("USDT approved successfully!");
    }
  }, [isApproveSuccess, refetchAllowance]);

  // useEffect(() => {
  //   if (isDepositSuccess) {
  //     refetchUsdtBalance();
  //     refetchCollateralBalance();
  //     toast.success("Collateral deposited successfully!");
  //     setAmount("");
  //   }
  // }, [isDepositSuccess, refetchUsdtBalance, refetchCollateralBalance]);

  // useEffect(() => {
  //   if (isWithdrawSuccess) {
  //     refetchUsdtBalance();
  //     refetchCollateralBalance();
  //     toast.success("Collateral withdrawn successfully!");
  //     setAmount("");
  //   }
  // }, [isWithdrawSuccess, refetchUsdtBalance, refetchCollateralBalance]);

  const isLoading = isApproving || isDepositPending || isWithdrawing;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Collateral Supply
        </CardTitle>
        <CardDescription>
          Deposit USDT as collateral to borrow against
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && userAddress && (
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground">USDT Balance</div>
              <div className="text-lg font-semibold">
                {formatTokenAmount(usdtBalance as bigint)}
              </div>
            </div>
            {/* <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                USDT Allowance
              </div>
              <div className="text-lg font-semibold">
                {formatTokenAmount(usdtAllowance)}
              </div>
            </div> */}
          </div>
        )}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Your Collateral
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Collateral</div>
            <div className="text-lg font-semibold">
              {formatTokenAmount(collateralBalance)}
            </div>
          </div>
        </div>

        {/* Total Supply Information */}
        {/* <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Total Supply Info
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary/5 rounded-lg border">
              <div className="text-xs text-muted-foreground">
                USDT Total Supply
              </div>
              <div className="text-sm font-semibold">
                {formatTokenAmount(usdtTotalSupply)}
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border">
              <div className="text-xs text-muted-foreground">
                Total Collateral Deposited
              </div>
              <div className="text-sm font-semibold">
                {formatTokenAmount(collateralTotalSupply)}
              </div>
            </div>
          </div>
        </div> */}

        <div className="flex gap-2">
          <Button
            variant={isDepositing ? "default" : "outline"}
            onClick={() => setIsDepositing(true)}
            className="flex-1"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Deposit
          </Button>
          <Button
            variant={!isDepositing ? "default" : "outline"}
            onClick={() => setIsDepositing(false)}
            className="flex-1"
          >
            <ArrowDownCircle className="h-4 w-4" />
            Withdraw
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (USDT)</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
          />
        </div>

        {isDepositing ? (
          <div className="space-y-2">
            {needsApproval && (
              <Button
                onClick={handleApprove}
                disabled={!isConnected || !amount || isLoading}
                variant="outline"
                className="w-full"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve USDT"
                )}
              </Button>
            )}
            <Button
              onClick={handleDeposit}
              disabled={!isConnected || !amount || isLoading || !!needsApproval}
              className="w-full"
            >
              {isDepositPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                "Deposit Collateral"
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleWithdraw}
            disabled={!isConnected || !amount || isLoading}
            className="w-full"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Withdrawing...
              </>
            ) : (
              "Withdraw Collateral"
            )}
          </Button>
        )}

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Connect your wallet to supply collateral
          </p>
        )}
      </CardContent>
    </Card>
  );
}
