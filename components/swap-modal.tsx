"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowUpDown,
  ArrowLeftRight,
  Loader2,
  Settings,
  Plus,
  Info,
} from "lucide-react";
import {
  useKxStockBalance,
  useTokenBalance,
  useKxStockPrice,
} from "@/hooks/use-contracts";
import { formatTokenAmount, SafeMath } from "@/lib/utils";
import { mockUsdtContract } from "@/lib/contracts";
import { toast } from "sonner";
import Image from "next/image";
import { TokenIcon } from "@web3icons/react";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("swap");

  // Swap states
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState<"kxAPPLE" | "USDT">("kxAPPLE");
  const [toToken, setToToken] = useState<"kxAPPLE" | "USDT">("USDT");
  const [isSwapping, setIsSwapping] = useState(false);

  // Liquidity states
  const [liquidityAmount1, setLiquidityAmount1] = useState("");
  const [liquidityAmount2, setLiquidityAmount2] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  // Mock data instead of real API calls
  const kxAppleBalance = "150000"; // 1500 tokens (18 decimals)
  const usdtBalance = "2500000"; // 25000 USDT (6 decimals)
  const { data: kxApplePrice } = useKxStockPrice();

  // Calculate exchange rate
  const exchangeRate = kxApplePrice ? parseFloat(kxApplePrice) : 100;

  const handleAmountChange = (value: string, isFromAmount: boolean) => {
    if (isFromAmount) {
      setFromAmount(value);
      if (value) {
        const numValue = parseFloat(value);
        if (fromToken === "kxAPPLE") {
          const calculatedTo = (numValue * exchangeRate).toFixed(6);
          setToAmount(calculatedTo);
        } else {
          const calculatedTo = (numValue / exchangeRate).toFixed(6);
          setToAmount(calculatedTo);
        }
      } else {
        setToAmount("");
      }
    } else {
      setToAmount(value);
      if (value) {
        const numValue = parseFloat(value);
        if (toToken === "kxAPPLE") {
          const calculatedFrom = (numValue * exchangeRate).toFixed(6);
          setFromAmount(calculatedFrom);
        } else {
          const calculatedFrom = (numValue / exchangeRate).toFixed(6);
          setFromAmount(calculatedFrom);
        }
      } else {
        setFromAmount("");
      }
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!userAddress || !fromAmount || !isConnected) return;

    setIsSwapping(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Swap completed successfully!", {
        description: `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`,
      });
      setFromAmount("");
      setToAmount("");
    } catch (error) {
      toast.error("Swap failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!userAddress || !liquidityAmount1 || !liquidityAmount2 || !isConnected)
      return;

    setIsAddingLiquidity(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Liquidity added successfully!", {
        description: `Added ${liquidityAmount1} kxAPPLE and ${liquidityAmount2} USDT to the pool`,
      });
      setLiquidityAmount1("");
      setLiquidityAmount2("");
    } catch (error) {
      toast.error("Add liquidity failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const getBalance = (token: "kxAPPLE" | "USDT") => {
    if (token === "kxAPPLE") {
      return kxAppleBalance ? formatTokenAmount(kxAppleBalance, 6, 6) : "0";
    } else {
      return usdtBalance ? formatTokenAmount(usdtBalance, 6, 6) : "0";
    }
  };

  const getTokenIcon = (token: "kxAPPLE" | "USDT") => {
    return token === "kxAPPLE" ? (
      <Image
        src="/XAPPL_LOGO.svg"
        alt="kxApple"
        width={20}
        height={20}
        className="rounded-full"
      />
    ) : (
      <TokenIcon symbol="usdt" variant="branded" size="20" />
    );
  };

  const isInsufficientBalance = (token: "kxAPPLE" | "USDT", amount: string) => {
    if (!amount) return false;
    const balance =
      token === "kxAPPLE"
        ? kxAppleBalance
          ? parseFloat(formatTokenAmount(kxAppleBalance, 18, 6))
          : 0
        : usdtBalance
          ? parseFloat(formatTokenAmount(usdtBalance, 6, 6))
          : 0;
    return parseFloat(amount) > balance;
  };

  const handleLiquidityAmountChange = (value: string, isFirst: boolean) => {
    if (isFirst) {
      setLiquidityAmount1(value);
      if (value && exchangeRate) {
        const calculatedAmount2 = (parseFloat(value) * exchangeRate).toFixed(6);
        setLiquidityAmount2(calculatedAmount2);
      } else {
        setLiquidityAmount2("");
      }
    } else {
      setLiquidityAmount2(value);
      if (value && exchangeRate) {
        const calculatedAmount1 = (parseFloat(value) / exchangeRate).toFixed(6);
        setLiquidityAmount1(calculatedAmount1);
      } else {
        setLiquidityAmount1("");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              {activeTab === "swap" ? "Swap Tokens" : "Add Liquidity"}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swap" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Swap
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Liquidity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="space-y-4 mt-6">
            {/* From Token */}
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    From
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Balance: {getBalance(fromToken)}
                  </span>
                </div>
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex items-center space-x-2 bg-secondary/50 rounded-lg px-3 py-2 w-50">
                    <span className="text-xl">{getTokenIcon(fromToken)}</span>
                    {/* <Image
                      src="/XAPPL_LOGO.svg"
                      alt="kxApple"
                      width={20}
                      height={20}
                      className="rounded-full"
                    /> */}
                    <span className="font-semibold">{fromToken}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value, true)}
                    className="text-right text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {isInsufficientBalance(fromToken, fromAmount) && (
                  <p className="text-sm text-red-500 mt-2">
                    Insufficient {fromToken} balance
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Swap Direction Button */}
            <div className="flex justify-center relative">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFlipTokens}
                className="rounded-full border-4 border-background bg-secondary hover:bg-secondary/80 z-10"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Token */}
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    To
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 w-50 bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="text-xl">{getTokenIcon(toToken)}</span>
                    <span className="font-semibold">{toToken}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    onChange={(e) => handleAmountChange(e.target.value, false)}
                    className="text-right text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rate Info */}
            {kxApplePrice && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    <span>Rate</span>
                  </div>
                  <span className="font-medium">
                    1 kxAPPLE = {parseFloat(kxApplePrice).toFixed(2)} USDT
                  </span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={
                !isConnected ||
                !fromAmount ||
                !toAmount ||
                isSwapping ||
                isInsufficientBalance(fromToken, fromAmount)
              }
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Swapping...
                </>
              ) : !isConnected ? (
                "Connect Wallet"
              ) : !fromAmount ? (
                "Enter amount"
              ) : isInsufficientBalance(fromToken, fromAmount) ? (
                `Insufficient ${fromToken} balance`
              ) : (
                `Swap ${fromToken} for ${toToken}`
              )}
            </Button>
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-4 mt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Add Liquidity Pool
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Provide equal value of both tokens to earn fees from trades.
                    You'll receive LP tokens representing your share.
                  </p>
                </div>
              </div>
            </div>

            {/* Token 1 Input */}
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    kxAPPLE Amount
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Balance: {getBalance("kxAPPLE")}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 min-w-0 bg-secondary/50 rounded-lg px-3 py-2 w-50">
                    <span className="text-xl">{getTokenIcon("kxAPPLE")}</span>
                    <span className="font-semibold">kxAPPLE</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={liquidityAmount1}
                    onChange={(e) =>
                      handleLiquidityAmountChange(e.target.value, true)
                    }
                    className="text-right text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {isInsufficientBalance("kxAPPLE", liquidityAmount1) && (
                  <p className="text-sm text-red-500 mt-2">
                    Insufficient kxAPPLE balance
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Token 2 Input */}
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    USDT Amount
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Balance: {getBalance("USDT")}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 min-w-0 bg-secondary/50 rounded-lg px-3 py-2 w-50">
                    <span className="text-xl">{getTokenIcon("USDT")}</span>{" "}
                    <span className="font-semibold">USDT</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={liquidityAmount2}
                    onChange={(e) =>
                      handleLiquidityAmountChange(e.target.value, false)
                    }
                    className="text-right text-lg font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {isInsufficientBalance("USDT", liquidityAmount2) && (
                  <p className="text-sm text-red-500 mt-2">
                    Insufficient USDT balance
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pool Share Info */}
            {liquidityAmount1 && liquidityAmount2 && (
              <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pool Share</span>
                  <span className="font-medium">0.001%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>LP Tokens</span>
                  <span className="font-medium">
                    ~
                    {(
                      (parseFloat(liquidityAmount1) *
                        parseFloat(liquidityAmount2)) /
                      100
                    ).toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* Add Liquidity Button */}
            <Button
              onClick={handleAddLiquidity}
              disabled={
                !isConnected ||
                !liquidityAmount1 ||
                !liquidityAmount2 ||
                isAddingLiquidity ||
                isInsufficientBalance("kxAPPLE", liquidityAmount1) ||
                isInsufficientBalance("USDT", liquidityAmount2)
              }
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isAddingLiquidity ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding Liquidity...
                </>
              ) : !isConnected ? (
                "Connect Wallet"
              ) : !liquidityAmount1 || !liquidityAmount2 ? (
                "Enter amounts"
              ) : isInsufficientBalance("kxAPPLE", liquidityAmount1) ? (
                "Insufficient kxAPPLE balance"
              ) : isInsufficientBalance("USDT", liquidityAmount2) ? (
                "Insufficient USDT balance"
              ) : (
                "Add Liquidity"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
