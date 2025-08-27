"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Big from "big.js";
import { parseUnits } from "viem";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  useKxStockBalance,
  useCollateralBalance,
  useBorrow,
  useRepay,
  useLendingDeposit,
  useLendingWithdraw,
  useTokenApproval,
  useTransactionReceipt,
  useKxStockPrice,
  useKxStockInfo,
} from "@/hooks/use-contracts";
import { useCompleteMarketData } from "@/hooks/useMarketData";
import { formatNumber, formatTokenAmount, SafeMath } from "@/lib/utils";
import { CONTRACTS } from "@/lib/config";
import { useTokenAllowance } from "@/hooks/use-token-approval";
import {
  kxStockContract,
  collateralVaultContract,
  lendingVaultContract,
} from "@/lib/contracts";
import { toast } from "sonner";
import {
  DollarSign,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  BarChart3,
  Upload,
  ArrowDown,
  HandCoins,
  ArrowLeftRight,
  ArrowUp,
  CheckCircle,
  X,
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/lib/wagmi";

export function MarketDetail() {
  const { address: userAddress, isConnected } = useAccount();
  console.log({ userAddress });
  const [supplyAmount, setSupplyAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [activeTab, setActiveTab] = useState<
    "supply" | "withdraw" | "borrow" | "repay"
  >("supply");

  // Modal states
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [modalSupplyAmount, setModalSupplyAmount] = useState("");
  const [modalWithdrawAmount, setModalWithdrawAmount] = useState("");
  const [modalBorrowAmount, setModalBorrowAmount] = useState("");
  const [modalRepayAmount, setModalRepayAmount] = useState("");

  const [isApprovingSupply, setIsApprovingSupply] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);

  const { data: kxStockBalance, refetch: refetchKxStockBalance } =
    useKxStockInfo(userAddress);
  const { data: collateralBalance, refetch: refetchCollateralBalance } =
    useCollateralBalance(userAddress);
  const { data: kxStockPrice } = useKxStockPrice();

  // Track last approve action for UI feedback
  const [lastApproveAction, setLastApproveAction] = useState<
    "supply" | "repay" | null
  >(null);

  // Helper functions to check approval status based on allowance
  const isSupplyApproved = (amount?: string): boolean => {
    if (!amount || !supplyAllowance) return false;
    try {
      const amountBigInt = parseUnits(amount, 18);
      return supplyAllowance >= amountBigInt;
    } catch {
      return false;
    }
  };

  // const isRepayApproved = (amount?: string): boolean => {
  //   if (!amount || !repayAllowance) return false;
  //   try {
  //     const amountBigInt = parseUnits(amount, 18);
  //     return repayAllowance >= amountBigInt;
  //   } catch {
  //     return false;
  //   }
  // };

  // Get market data and user market data
  const { marketData, userData, refetchCompleteMarketData } =
    useCompleteMarketData(userAddress);
  console.log({ marketData });

  const {
    approve,
    hash: approveHash,
    // isPending: isApproving,
  } = useTokenApproval();

  // Check allowances for supply and repay operations
  const { data: supplyAllowance, refetch: refetchSupplyAllowance } =
    useTokenAllowance(
      kxStockContract.address,
      userAddress,
      lendingVaultContract.address
    );

  console.log({ supplyAllowance, spender: lendingVaultContract.address });

  const { borrow, hash: borrowHash, isPending: isBorrowPending } = useBorrow();
  const { repay, hash: repayHash, isPending: isRepaying } = useRepay();
  const {
    deposit,
    hash: depositHash,
    isPending: isDepositPending,
  } = useLendingDeposit();
  const {
    withdraw,
    hash: withdrawHash,
    isPending: isWithdrawing,
  } = useLendingWithdraw();

  const { isSuccess: isApproveSuccess } = useTransactionReceipt(approveHash);
  const { isSuccess: isBorrowSuccess } = useTransactionReceipt(borrowHash);
  const { isSuccess: isRepaySuccess } = useTransactionReceipt(repayHash);
  const { isSuccess: isDepositSuccess } = useTransactionReceipt(depositHash);
  const { isSuccess: isWithdrawSuccess } = useTransactionReceipt(withdrawHash);
  console.log({ isApproveSuccess });
  // Reset approval action when user address changes
  useEffect(() => {
    setLastApproveAction(null);
  }, [userAddress]);

  // Use real market data instead of dummy data
  const supplyAPY = new Big(marketData.supplyAPY || 0);
  const borrowAPY = new Big(marketData.borrowAPY || 0);
  const totalSupplied = new Big(marketData.formattedTotalAssets || 0);
  const totalBorrowed = new Big(marketData.formattedTotalBorrows || 0);
  const utilizationRate = new Big(marketData.utilizationRate || 0);

  // Calculate other values from market data
  const optimalUtilization = new Big(
    Number(marketData.optimalUtilization || 0) / 1e16
  ); // Convert from 1e18 to percentage
  const baseRate = new Big(
    (Number(marketData.baseRatePerSecond || 0) * 31536000) / 1e16
  ); // Convert to annual percentage
  const slope1 = new Big(
    (Number(marketData.slope1PerSecond || 0) * 31536000) / 1e16
  ); // Convert to annual percentage
  const slope2 = new Big(
    (Number(marketData.slope2PerSecond || 0) * 31536000) / 1e16
  ); // Convert to annual percentage

  // Calculate max borrowable amount (75% LTV)
  const maxBorrowable = collateralBalance
    ? new Big(collateralBalance.toString())
        .div(new Big(10).pow(18))
        .times(new Big(0.75))
    : new Big(0);

  const maxBorrowCap = maxBorrowable.toFixed(2);
  const maxBorrowCapInUSD =
    marketData.borrowCap && kxStockPrice
      ? `${SafeMath.multiply(maxBorrowCap, kxStockPrice).toFixed(2)}`
      : "0";

  // Available to supply = wallet balance
  const availableToSupply = kxStockBalance.balance || BigInt(0);

  // Available to borrow = max borrowable based on collateral
  const availableToBorrow = maxBorrowable;

  // Calculate token amounts and USD values (following markets-list.tsx pattern)
  const totalSupplyInETH = marketData.totalAssets
    ? `${formatTokenAmount(marketData.totalAssets, 18, 2)}`
    : "0";
  const totalBorrowInETH = marketData.totalBorrows
    ? `${formatTokenAmount(marketData.totalBorrows, 18, 2)}`
    : "0";

  const totalSupplyInUSD =
    marketData.totalAssets && kxStockPrice
      ? `${SafeMath.multiply(totalSupplyInETH, kxStockPrice).toFixed(2)}`
      : "0";
  const totalBorrowInUSD =
    marketData.totalBorrows && kxStockPrice
      ? `${SafeMath.multiply(totalBorrowInETH, kxStockPrice).toFixed(2)}`
      : "0";

  // User-specific token amounts and USD values
  const userBalanceInETH = availableToSupply
    ? `${formatTokenAmount(availableToSupply, 18, 2)}`
    : "0";
  const userBalanceInUSD =
    availableToSupply && kxStockPrice
      ? `${SafeMath.multiply(userBalanceInETH, kxStockPrice).toFixed(2)}`
      : "0";

  const userSuppliedInETH = userData?.formattedUserSuppliedAssets || "0";
  const userSuppliedInUSD =
    userData?.userSuppliedAssets && kxStockPrice
      ? `${SafeMath.multiply(userSuppliedInETH, kxStockPrice).toFixed(2)}`
      : "0";

  const userBorrowedInETH = userData?.formattedUserBorrowedAssets || "0";
  const userBorrowedInUSD =
    userData?.userBorrowedAssets && kxStockPrice
      ? `${SafeMath.multiply(userBorrowedInETH, kxStockPrice).toFixed(2)}`
      : "0";

  // Calculate collateral amounts from useCollateralBalance hook
  const userCollateralAmount = collateralBalance
    ? formatTokenAmount(collateralBalance, 18, 2)
    : "0";
  const userCollateralInUSD = userCollateralAmount;

  const supplyReserve = SafeMath.subtract(totalSupplyInETH, totalBorrowInETH);
  const supplyReserveInUSD = SafeMath.multiply(supplyReserve, kxStockPrice);
  const supplyShare =
    totalSupplyInETH === "0"
      ? "0"
      : SafeMath.divide(supplyReserve, totalSupplyInETH).toFixed(2);
  const borrowReserve = SafeMath.subtract(totalBorrowInETH, totalSupplyInETH);
  const borrowReserveInUSD = SafeMath.multiply(borrowReserve, kxStockPrice);
  const borrowShare =
    totalSupplyInETH === "0"
      ? "0"
      : SafeMath.divide(totalBorrowInETH, totalSupplyInETH).toFixed(2);

  const handleSupplyApprove = async () => {
    if (!userAddress || !modalSupplyAmount) return;
    try {
      setIsApprovingSupply(true);
      setLastApproveAction("supply");
      const result = await approve(CONTRACTS.KX_APPLE, CONTRACTS.LENDING_VAULT);
      if (!!result) {
        toast.info("Approval submitted");
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });
        console.log({ receipt });
        if (!!receipt) {
          toast.success("kxApple approved successfully!");
        } else {
          toast.error("Approval failed");
        }
      }
    } catch (error) {
      toast.error("Approval failed");
      console.error({ error });
    } finally {
      setIsApprovingSupply(false);
    }
  };

  const handleSupply = async () => {
    if (!userAddress || !modalSupplyAmount) return;
    try {
      const result = await deposit(modalSupplyAmount, userAddress);
      console.log({ result });
      if (!!result) {
        toast.success("Supply submitted");
      } else {
        toast.error("Supply failed");
      }
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: result,
      });
      console.log({ receipt });
      if (!!receipt) {
        toast.success("Supplied Successfully!");
        refetchCompleteMarketData();
        setIsSupplyModalOpen(false);
        setModalSupplyAmount("");
      } else {
        toast.error("Supply failed");
      }
    } catch (error) {
      toast.error("Supply failed");
    }
  };

  const handleWithdraw = async () => {
    if (!userAddress || !modalWithdrawAmount) return;
    try {
      const result = await withdraw(
        modalWithdrawAmount,
        userAddress,
        userAddress
      );
      console.log({ result });
      if (!!result) {
        toast.success("Withdrawal submitted");
      } else {
        toast.error("Withdrawal failed");
      }

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: result,
      });
      console.log({ receipt });
      if (!!receipt) {
        toast.success("Withdrawal submitted");
        refetchCompleteMarketData();
        setIsWithdrawModalOpen(false);
        setModalWithdrawAmount("");
      } else {
        toast.error("Withdrawal failed");
      }
    } catch (error) {
      toast.error("Withdrawal failed");
    }
  };

  const handleBorrow = async () => {
    if (!userAddress || !modalBorrowAmount) return;
    setIsBorrowing(true);
    try {
      const result = await borrow(modalBorrowAmount);
      if (!!result) {
        toast.success("Borrow Transaction submitted");
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });
        console.log({ receipt });
        if (!!receipt) {
          toast.success("Borrow Success!");
          refetchCompleteMarketData();
          refetchCollateralBalance();
          setIsBorrowModalOpen(false);
          setModalBorrowAmount("");
        } else {
          toast.error("Borrow failed");
        }
      } else {
        toast.error("Borrow failed");
      }
    } catch (error) {
      toast.error("Borrow failed");
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleRepayApprove = async () => {
    if (!userAddress || !modalRepayAmount) return;
    try {
      setLastApproveAction("repay");
      approve(CONTRACTS.KX_APPLE, CONTRACTS.LENDING_VAULT);
      toast.info("Approval submitted");
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleRepay = async () => {
    if (!userAddress || !modalRepayAmount) return;
    try {
      const result = await repay(modalRepayAmount, userAddress);
      console.log({ result });
      if (!!result) {
        toast.success("Repay submitted");
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: result,
        });
        console.log({ receipt });
        if (!!receipt) {
          toast.success("Repaid Successfully!");
          refetchKxStockBalance();
          refetchCompleteMarketData();
          refetchCollateralBalance();
          setIsRepayModalOpen(false);
          setModalRepayAmount("");
        } else {
          toast.error("Repay failed");
        }
      } else {
        toast.error("Repay failed");
      }
    } catch (error) {
      toast.error("Repay failed");
    }
  };

  // Helper function to check if approval is needed based on action type
  const needsApproval = (
    amount: string,
    actionType: "supply" | "repay"
  ): boolean => {
    if (!amount || Number(amount) <= 0) return false;

    // Check if already approved for this action based on allowance
    if (actionType === "supply") {
      return !isSupplyApproved(amount);
    } else if (actionType === "repay") {
      // return !isRepayApproved(amount);
    }

    return true;
  };

  // Handle transaction success with useEffect to prevent rendering loops
  useEffect(() => {
    if (isApproveSuccess) {
      // Refetch allowances to update approval state
      if (lastApproveAction === "supply") {
        refetchSupplyAllowance();
      } else if (lastApproveAction === "repay") {
        // refetchRepayAllowance();
      }
      setLastApproveAction(null);
      // toast.success("kxApple approved successfully!");
    }
  }, [
    isApproveSuccess,
    lastApproveAction,
    refetchSupplyAllowance,
    // refetchRepayAllowance,
  ]);

  // useEffect(() => {
  //   if (isDepositSuccess) {
  //     refetchKxStockBalance();
  //     refetchSupplyAllowance(); // Refetch allowance after successful supply
  //     toast.success("Supplied successfully!");
  //     setSupplyAmount("");
  //     setModalSupplyAmount("");
  //     setIsSupplyModalOpen(false);
  //   }
  // }, [isDepositSuccess, refetchKxStockBalance, refetchSupplyAllowance]);

  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchKxStockBalance();
      toast.success("Withdrawn successfully!");
      setSupplyAmount("");
    }
  }, [isWithdrawSuccess, refetchKxStockBalance]);

  // useEffect(() => {
  //   if (isBorrowSuccess) {
  //     refetchKxStockBalance();
  //     refetchCompleteMarketData();
  //     refetchCollateralBalance();
  //     toast.success("Borrowed successfully!");
  //     setBorrowAmount("");
  //     setModalBorrowAmount("");
  //     setIsBorrowModalOpen(false);
  //   }
  // }, [
  //   isBorrowSuccess,
  //   refetchKxStockBalance,
  //   refetchCompleteMarketData,
  //   refetchCollateralBalance,
  // ]);

  useEffect(() => {
    if (isRepaySuccess) {
      refetchKxStockBalance();
      // refetchRepayAllowance(); // Refetch allowance after successful repay
      toast.success("Repaid successfully!");
      setBorrowAmount("");
      setModalRepayAmount("");
      setIsRepayModalOpen(false);
    }
  }, [
    isRepaySuccess,
    refetchKxStockBalance,
    // refetchRepayAllowance
  ]);

  const isLoading =
    isApprovingSupply ||
    isDepositPending ||
    isWithdrawing ||
    isBorrowPending ||
    isBorrowing ||
    isRepaying;
  const hasCollateral = collateralBalance && collateralBalance > 0n;

  return (
    <div className="max-w-full mx-auto p-4 space-y-6">
      {/* Market Header */}
      {/* <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">kX</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold">kxApple Market</h1>
          <p className="text-muted-foreground">
            Supply kxApple and earn yield, or borrow against collateral
          </p>
        </div>
      </div> */}
      <Card className="bg-slate-700 border-gray-600/50 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">kX</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">kxAPPLE</h2>
                <p className="text-sm text-gray-400">kaia xAPPLE</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Supplied</div>
                <div className="text-lg font-semibold text-white">
                  {`$${formatNumber(totalSupplyInUSD)}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Borrowed</div>
                <div className="text-lg font-semibold text-white">
                  {`$${formatNumber(totalBorrowInUSD)}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">
                  Utilization Rate
                </div>
                <div className="text-lg font-semibold text-white">
                  {formatNumber(utilizationRate.toFixed(2))}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Oracle price</div>
                <div className="text-lg font-semibold text-white flex items-center gap-1">
                  {`$${formatNumber(kxStockPrice)}`}
                  {/* <button className="p-1 hover:bg-gray-700 rounded">
                    <ArrowUpCircle className="w-3 h-3 text-gray-400" />
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Your Info - Blue Box (Mobile: full width, Desktop: left side) */}
        <div className="xl:col-span-1">
          <Card className="bg-gray-800 border-gray-700/50 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Your Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && userAddress ? (
                <>
                  <div className="space-y-3">
                    <div className="p-3  rounded-lg flex flex-col gap-[1px]">
                      <div className="text-sm text-white/80">Your Balance</div>
                      <div className="flex items-center gap-[2px]">
                        <div className="text-lg font-semibold">
                          {formatNumber(userBalanceInETH)}
                        </div>
                        <div className="text-lg font-semibold text-muted-foreground">
                          kxAPPLE
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {`$ ${formatNumber(userBalanceInUSD)}`}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="flex-1 w-full bg-slate-500 hover:bg-slate-500/50 "
                          size="sm"
                          onClick={() => setIsSupplyModalOpen(true)}
                        >
                          <ArrowUp className="h-4 w-4" />
                          Supply
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="p-3 rounded-lg flex flex-col gap-[1px]">
                      <div className="text-sm text-muted-foreground">
                        Your Supplies
                      </div>
                      <div className="flex items-center gap-[2px]">
                        <div className="text-lg font-semibold">
                          {formatNumber(userSuppliedInETH)}
                        </div>
                        <div className="text-lg font-semibold text-muted-foreground">
                          kxAPPLE
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {`$ ${formatNumber(userSuppliedInUSD)}`}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="flex-1 w-full bg-slate-500 hover:bg-slate-500/50 "
                          size="sm"
                          onClick={() => setIsWithdrawModalOpen(true)}
                        >
                          <ArrowDown className="h-4 w-4" />
                          Withdraw
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="p-3 rounded-lg flex flex-col gap-[1px]">
                      <div className="text-sm text-muted-foreground">
                        Your Collateral
                      </div>
                      <div className="flex items-center gap-[2px]">
                        <div className="text-lg font-semibold">
                          {formatNumber(userCollateralAmount)}
                        </div>
                        <div className="text-lg font-semibold text-muted-foreground">
                          USDT
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {`$ ${formatNumber(userCollateralInUSD)}`}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="flex-1 w-full bg-slate-500 hover:bg-slate-500/50 "
                          size="sm"
                          onClick={() => setIsBorrowModalOpen(true)}
                        >
                          <HandCoins className="h-4 w-4" />
                          Borrow
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="p-3 rounded-lg flex flex-col gap-[1px]">
                      <div className="text-sm text-muted-foreground">
                        Your Borrows
                      </div>
                      <div className="flex items-center gap-[2px]">
                        <div className="text-lg font-semibold">
                          {formatNumber(userBorrowedInETH)}
                        </div>
                        <div className="text-lg font-semibold text-muted-foreground">
                          kxAPPLE
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {`$ ${formatNumber(userBorrowedInUSD)}`}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          className="flex-1 w-full bg-slate-500 hover:bg-slate-500/50 "
                          size="sm"
                          onClick={() => setIsRepayModalOpen(true)}
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          Repay
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to view your info
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          {/* Token Header Section */}
          {/* <Card className="bg-slate-700 border-gray-600/50 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WETH</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">WETH</h2>
                    <p className="text-sm text-gray-400">Wrapped ETH</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-1 hover:bg-gray-700 rounded">
                      <ArrowUpCircle className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded">
                      <ArrowDownCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      Reserve Size
                    </div>
                    <div className="text-lg font-semibold text-white">
                      $621.44M
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      Available liquidity
                    </div>
                    <div className="text-lg font-semibold text-white">
                      $122.87M
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      Utilization Rate
                    </div>
                    <div className="text-lg font-semibold text-white">
                      80.23%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      Oracle price
                    </div>
                    <div className="text-lg font-semibold text-white flex items-center gap-1">
                      $4,566.67
                      <button className="p-1 hover:bg-gray-700 rounded">
                        <ArrowUpCircle className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card className="bg-gray-800 border-gray-700/50 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Market status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Supply Info */}
              <div className="h-full">
                <h3 className="text-base font-medium mb-4 text-gray-300">
                  Supply Info
                </h3>
                <div className="flex flex-col divide-y-3">
                  <div>
                    <div className="flex items-center h-full gap-2 mb-6 divide-x-1 ">
                      <div className="flex items-center gap-4 pr-4">
                        <CircularProgress
                          percentage={Number(supplyShare) * 100}
                          size={80}
                          strokeWidth={6}
                          color="#10b981"
                          backgroundColor="#4b5563"
                        />
                        <div>
                          <div className="text-sm text-gray-400">
                            Total Reserve
                          </div>
                          <div className="text-lg font-semibold">
                            {formatNumber(
                              SafeMath.subtract(
                                totalSupplyInETH,
                                totalBorrowInETH
                              ).toFixed(2)
                            )}{" "}
                            of {formatNumber(totalSupplyInETH)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {`$${formatNumber(
                              supplyReserveInUSD.toFixed(2)
                            )} of $${formatNumber(totalSupplyInUSD)}`}
                          </div>
                        </div>
                      </div>

                      <div className="pl-4">
                        <div className="text-sm text-gray-400">Supply APY</div>
                        <div className="text-lg font-semibold text-white">
                          {formatNumber(supplyAPY.toFixed(2))}%
                        </div>
                      </div>
                    </div>

                    {/* Supply APY Chart */}
                    {/* <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Supply APR</span>
                        <div className="flex gap-1 ml-auto">
                          <button className="px-2 py-1 text-xs bg-gray-700/80 hover:bg-gray-600/80 rounded transition-colors">
                            1w
                          </button>
                          <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                            1m
                          </button>
                          <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                            6m
                          </button>
                          <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                            1y
                          </button>
                        </div>
                      </div>
                      <div className="h-20 bg-gray-800/60 border border-gray-700/30 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">
                          Chart placeholder
                        </span>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              {/* Borrow Info */}
              <div>
                <h3 className="text-base font-medium mb-4 text-gray-300">
                  Borrow Info
                </h3>
                <div className="flex items-center h-full gap-2 mb-6 divide-x-1 ">
                  <div className="flex items-center gap-4 pr-4">
                    <CircularProgress
                      percentage={Number(borrowShare) * 100}
                      size={80}
                      strokeWidth={6}
                      color="#ef4444"
                      backgroundColor="#4b5563"
                    />
                    <div>
                      <div className="text-sm text-gray-400">Total Borrow</div>
                      <div className="text-lg font-semibold">
                        {formatNumber(totalBorrowInETH)} of{" "}
                        {formatNumber(totalSupplyInETH)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {`$${formatNumber(totalBorrowInUSD)} of $${formatNumber(
                          totalSupplyInUSD
                        )}`}
                      </div>
                    </div>
                  </div>
                  <div className="pl-4 ">
                    <div className="text-sm text-gray-400">Borrow APY</div>
                    <div className="text-lg font-semibold text-white">
                      {formatNumber(borrowAPY.toFixed(2))}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-center"></div>

                {/* Borrow APY Chart */}
                {/* <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Borrow APR, variable</span>
                    <div className="flex gap-1 ml-auto">
                      <button className="px-2 py-1 text-xs bg-gray-700/80 hover:bg-gray-600/80 rounded transition-colors">
                        1w
                      </button>
                      <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                        1m
                      </button>
                      <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                        6m
                      </button>
                      <button className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors">
                        1y
                      </button>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-800/60 border border-gray-700/30 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">
                      Chart placeholder
                    </span>
                  </div>
                </div> */}
              </div>
              {/* <Separator className="my-4" /> */}

              {/* Interest Rate Model */}
              {/* <div>
                <h3 className="text-base font-medium mb-4 text-gray-300">
                  Interest rate model
                </h3>
                <div className="mb-4">
                  <div className="text-sm text-gray-400">Utilization Rate</div>
                  <div className="text-lg font-semibold">80.26%</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Borrow APR, variable</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-4"></div>
                    <span>Utilization Rate</span>
                  </div>
                  <div className="h-20 bg-gray-800/60 border border-gray-700/30 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">
                      Interest rate model chart
                    </span>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market Info  */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Market Information</CardTitle>
          <CardDescription>
            Key metrics for the kxApple lending market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                ${totalSupplyInUSD}
              </div>
              <div className="text-sm text-muted-foreground">Market Size</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                $
                {(Number(totalSupplyInUSD) - Number(totalBorrowInUSD)).toFixed(
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Available Liquidity
              </div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {utilizationRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Utilization Rate
              </div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                ${kxStockPrice ? Number(kxStockPrice).toFixed(2) : "1.00"}
              </div>
              <div className="text-sm text-muted-foreground">Oracle Price</div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Supply Modal */}
      <Dialog open={isSupplyModalOpen} onOpenChange={setIsSupplyModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-500" />
              Supply kxAPPLE
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Supply kxAPPLE to earn interest
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Available Balance Display */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Available to supply
                </span>
                <span className="text-sm text-gray-400">Balance</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">
                    {formatNumber(userBalanceInETH)}
                  </div>
                  <div className="text-sm text-gray-400">kxAPPLE</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    ${formatNumber(userBalanceInUSD)}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Amount to supply
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalSupplyAmount}
                  onChange={(e) => setModalSupplyAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white text-lg pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">kxAPPLE</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-gray-600 border-gray-500 hover:bg-gray-500"
                    onClick={() => setModalSupplyAmount(userBalanceInETH)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              {modalSupplyAmount && (
                <div className="text-sm text-gray-400">
                  ≈ $
                  {formatNumber(
                    (
                      Number(modalSupplyAmount) * Number(kxStockPrice || "1")
                    ).toFixed(2)
                  )}
                </div>
              )}
            </div>

            {/* Approval Status */}
            {modalSupplyAmount && (
              <div
                className={`p-3 rounded-lg border ${
                  needsApproval(modalSupplyAmount, "supply")
                    ? "bg-orange-500/10 border-orange-500/20"
                    : "bg-green-500/10 border-green-500/20"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {needsApproval(modalSupplyAmount, "supply") ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-300">
                        Approval required for this amount
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-300">
                        Sufficient allowance available
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Supply APY Info */}
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Supply APY</span>
                <span className="text-lg font-semibold text-green-400">
                  {formatNumber(supplyAPY.toFixed(2))}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                onClick={() => {
                  setIsSupplyModalOpen(false);
                  setModalSupplyAmount("");
                }}
              >
                Cancel
              </Button>

              {modalSupplyAmount &&
              needsApproval(modalSupplyAmount, "supply") ? (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !modalSupplyAmount ||
                    Number(modalSupplyAmount) <= 0 ||
                    isApprovingSupply
                  }
                  onClick={handleSupplyApprove}
                >
                  {isApprovingSupply ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve kxAPPLE
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={
                    !modalSupplyAmount ||
                    Number(modalSupplyAmount) <= 0 ||
                    isDepositPending
                  }
                  onClick={handleSupply}
                >
                  {isDepositPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Supplying...
                    </>
                  ) : (
                    <>Supply</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-blue-500" />
              Withdraw kxAPPLE
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Withdraw your supplied kxAPPLE
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Available to Withdraw Display */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Available to withdraw
                </span>
                <span className="text-sm text-gray-400">Supplied</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">
                    {formatNumber(userSuppliedInETH)}
                  </div>
                  <div className="text-sm text-gray-400">kxAPPLE</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    ${formatNumber(userSuppliedInUSD)}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Amount to withdraw
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalWithdrawAmount}
                  onChange={(e) => setModalWithdrawAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white text-lg pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">kxAPPLE</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-gray-600 border-gray-500 hover:bg-gray-500"
                    onClick={() => setModalWithdrawAmount(userSuppliedInETH)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              {modalWithdrawAmount && (
                <div className="text-sm text-gray-400">
                  ≈ $
                  {formatNumber(
                    SafeMath.multiply(
                      modalWithdrawAmount,
                      kxStockPrice || "1"
                    ).toFixed(2)
                  )}
                </div>
              )}
            </div>

            {/* Supply APY Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  Current Supply APY
                </span>
                <span className="text-lg font-semibold text-blue-400">
                  {formatNumber(supplyAPY.toFixed(2))}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                onClick={() => setIsWithdrawModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={
                  !modalWithdrawAmount ||
                  Number(modalWithdrawAmount) <= 0 ||
                  isWithdrawing
                }
                onClick={handleWithdraw}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Withdraw"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Repay Modal */}
      <Dialog open={isRepayModalOpen} onOpenChange={setIsRepayModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-500" />
              Repay kxAPPLE
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Repay your borrowed kxAPPLE
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Borrowed Amount Display */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Total borrowed</span>
                <span className="text-sm text-gray-400">Debt</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">
                    {formatNumber(userBorrowedInETH)}
                  </div>
                  <div className="text-sm text-gray-400">kxAPPLE</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    ${formatNumber(userBorrowedInUSD)}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Amount to repay
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalRepayAmount}
                  onChange={(e) => setModalRepayAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setModalRepayAmount(userBorrowedInETH)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-sm text-gray-400">kxAPPLE</span>
                </div>
              </div>
              {modalRepayAmount && (
                <div className="text-sm text-gray-400">
                  ≈ $
                  {formatNumber(
                    (
                      Number(modalRepayAmount) * Number(kxStockPrice || "1")
                    ).toFixed(2)
                  )}
                </div>
              )}
            </div>

            {/* Approval Status */}
            {modalRepayAmount && (
              <div
                className={`p-3 rounded-lg border ${
                  needsApproval(modalRepayAmount, "supply")
                    ? "bg-orange-500/10 border-orange-500/20"
                    : "bg-green-500/10 border-green-500/20"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {needsApproval(modalRepayAmount, "supply") ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-300">
                        Approval needed to repay kxAPPLE
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-300">
                        Ready to repay kxAPPLE
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Borrow APY Info */}
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  Current Borrow APY
                </span>
                <span className="text-lg font-semibold text-red-400">
                  {formatNumber(borrowAPY.toFixed(2))}%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                onClick={() => setIsRepayModalOpen(false)}
              >
                Cancel
              </Button>

              {modalRepayAmount && needsApproval(modalRepayAmount, "supply") ? (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !modalRepayAmount ||
                    Number(modalRepayAmount) <= 0 ||
                    isApprovingSupply
                  }
                  onClick={handleRepayApprove}
                >
                  {isApprovingSupply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Approve kxAPPLE"
                  )}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={
                    !modalRepayAmount ||
                    Number(modalRepayAmount) <= 0 ||
                    isRepaying
                  }
                  onClick={handleRepay}
                >
                  {isRepaying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Repay"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Borrow Modal */}
      <Dialog open={isBorrowModalOpen} onOpenChange={setIsBorrowModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-orange-500" />
              Borrow kxAPPLE
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Borrow kxAPPLE against your collateral
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Available Collateral Display */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Available to borrow
                </span>
                <span className="text-sm text-gray-400">Collateral</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">
                    {formatNumber(maxBorrowCap)}
                  </div>
                  <div className="text-sm text-gray-400">kxAPPLE</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    ${formatNumber(maxBorrowCapInUSD)}
                  </div>
                  <div className="text-sm text-gray-400">
                    75% LTV ({userCollateralAmount} USDT)
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Amount to borrow
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalBorrowAmount}
                  onChange={(e) => setModalBorrowAmount(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white text-lg pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">kxAPPLE</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs bg-gray-600 border-gray-500 hover:bg-gray-500"
                    onClick={() => setModalBorrowAmount(maxBorrowCap)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              {modalBorrowAmount && (
                <div className="text-sm text-gray-400">
                  ≈ $
                  {formatNumber(
                    (
                      Number(modalBorrowAmount) * Number(kxStockPrice || "1")
                    ).toFixed(2)
                  )}
                </div>
              )}
            </div>

            {/* Borrow Capacity Warning */}
            {modalBorrowAmount &&
              Number(modalBorrowAmount) > Number(maxBorrowCap) && (
                <div className="p-3 rounded-lg border bg-red-500/10 border-red-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <X className="h-4 w-4 text-red-400" />
                    <span className="text-red-300">
                      Insufficient collateral. Max borrowable: {maxBorrowCap}{" "}
                      kxAPPLE
                    </span>
                  </div>
                </div>
              )}

            {/* Collateral requirement info */}
            {modalBorrowAmount &&
              Number(modalBorrowAmount) <= Number(maxBorrowCap) && (
                <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-300">
                      Sufficient collateral for this borrow amount
                    </span>
                  </div>
                </div>
              )}

            {/* Borrow APY Info */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Borrow APY</span>
                <span className="text-lg font-semibold text-orange-400">
                  {formatNumber(borrowAPY.toFixed(2))}%
                </span>
              </div>
            </div>

            {/* Liquidation Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-sm text-yellow-300">
                <div className="font-medium mb-1">⚠️ Liquidation Risk</div>
                <div>
                  Your position may be liquidated if the value of your
                  collateral falls below the required ratio.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-gray-700 border-gray-600 hover:bg-gray-600"
                onClick={() => {
                  setIsBorrowModalOpen(false);
                  setModalBorrowAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={
                  !modalBorrowAmount ||
                  Number(modalBorrowAmount) <= 0 ||
                  Number(modalBorrowAmount) > Number(maxBorrowCap) ||
                  !hasCollateral ||
                  isBorrowing
                }
                onClick={handleBorrow}
              >
                {isBorrowing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Borrowing...
                  </>
                ) : (
                  <>Borrow</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
