"use client";

import { useState } from "react";
import Link from "next/link";
import Big from "big.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { SwapModal } from "@/components/swap-modal";
import Image from "next/image";

import {
  useCollateralBalance,
  useLendingVaultInfo,
  useLendingVaultTotalInfo,
  useKxStockInfo,
  useUsdtInfo,
  useLendingVaultViewFunctions,
  useKxStockPrice,
} from "@/hooks/use-contracts";
import { formatNumber, formatTokenAmount, SafeMath } from "@/lib/utils";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from "lucide-react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useMarketData } from "@/hooks/useMarketData";

interface MarketData {
  asset: string;
  symbol: string;
  totalSupplied: string;
  totalSuppliedValue: string;
  supplyAPY: string;
  totalBorrowed: string;
  totalBorrowedValue: string;
  borrowAPY: string;
  icon: string;
  trend: "up" | "down" | "stable";
  canBeCollateral: boolean;
  borrowEnabled: boolean;
}

export function MarketsList() {
  const { address: userAddress, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const { data: kxStockPrice } = useKxStockPrice();

  const viewData = useLendingVaultViewFunctions(userAddress);

  const { marketData } = useMarketData();

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

  const maxDepositCapInETH = marketData.maxDeposit
    ? `${formatTokenAmount(marketData.maxDeposit, 18, 2)}`
    : "0";
  const maxDepositCapInUSD = marketData.maxDeposit
    ? `${SafeMath.multiply(maxDepositCapInETH, kxStockPrice).toFixed(2)}`
    : "0";

  const maxBorrowCapInETH = totalSupplyInETH
    ? `${SafeMath.multiply(totalSupplyInETH, 0.85).toFixed(2)}`
    : "0";
  const maxBorrowCapInUSD = maxBorrowCapInETH
    ? `${SafeMath.multiply(maxBorrowCapInETH, kxStockPrice).toFixed(2)}`
    : "0";
  //=====
  const totalSupplyCapInETH = maxDepositCapInETH
    ? `${SafeMath.multiply(maxDepositCapInETH, 0.8).toFixed(2)}`
    : "0";

  const totalSupplyCapInETHs = viewData.maxDeposit
    ? `${formatTokenAmount(viewData.maxDeposit, 18, 2)}`
    : "0";
  const totalBorrowCapInETH = viewData.borrowCap
    ? `${formatTokenAmount(viewData.borrowCap, 18, 2)}`
    : "0";
  const totalSupplyCapInUSD =
    viewData.maxDeposit && kxStockPrice
      ? `${SafeMath.multiply(totalSupplyCapInETHs, kxStockPrice).toFixed(2)}`
      : "0";
  const totalBorrowCapInUSD =
    viewData.borrowCap && kxStockPrice
      ? `${SafeMath.multiply(totalBorrowCapInETH, kxStockPrice).toFixed(2)}`
      : "0";

  // Market data - Currently only kxApple, but structured as a list
  const markets: MarketData[] = [
    {
      asset: "kxApple",
      symbol: "kxAPPLE",
      totalSupplied: totalSupplyInETH,
      totalSuppliedValue: totalSupplyInUSD,
      supplyAPY: marketData.formattedSupplyAPY,
      totalBorrowed: totalBorrowInETH,
      totalBorrowedValue: totalBorrowInUSD,
      borrowAPY: marketData.formattedBorrowAPY,
      icon: "🍎",
      trend: "up",
      canBeCollateral: false,
      borrowEnabled: true,
    },
  ];

  const router = useRouter();

  const filteredMarkets = markets.filter(
    (market) =>
      market.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">kxStocks Markets</h1>
          <p className="text-muted-foreground">
            Supply and borrow assets across different markets
          </p>
        </div>

        {/* {authenticated && userAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>
                Your current supply and borrow positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Supplied kxApple (Lending Vault)
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {lendingVaultInfo.formattedAssets} kxApple
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Shares: {lendingVaultInfo.formattedShares}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Earning ~{new Big(5.2).toFixed(2)}% APY
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Collateral (USDT)
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatTokenAmount(collateralBalance)} USDT
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available for borrowing
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>

      {/* Markets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assets to Supply and Borrow</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b ">
                    <th className="text-left text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Asset
                    </th>
                    <th className="text-center text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Total Supplied
                    </th>
                    <th className="text-center text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Supply APY
                    </th>
                    <th className="text-center text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Total Borrowed
                    </th>
                    <th className="text-center text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Borrow APY
                    </th>
                    <th className="text-right text-xs py-2 px-2 font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map((market) => (
                    <tr
                      key={market.symbol}
                      className="border-b hover:bg-secondary/50"
                      onClick={() => {
                        router.push(`/market`);
                      }}
                    >
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          {/* <div className="text-2xl">{market.icon}</div> */}
                          <Image
                            src="/XAPPL_LOGO.svg"
                            alt="kxApple"
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                          <div>
                            <div className="font-semibold">{market.asset}</div>
                            <div className="text-sm text-muted-foreground">
                              {market.symbol}
                            </div>
                          </div>
                          {market.canBeCollateral && (
                            <Badge variant="secondary" className="text-xs">
                              Collateral
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div>
                          <div className="font-semibold">
                            {formatNumber(market.totalSupplied)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${formatNumber(market.totalSuppliedValue)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-semibold text-green-600">
                            {market.supplyAPY}%
                          </span>
                          {/* {getTrendIcon(market.trend)} */}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div>
                          <div className="font-semibold">
                            {formatNumber(market.totalBorrowed)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${formatNumber(market.totalBorrowedValue)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="font-semibold text-red-600">
                            {market.borrowAPY}%
                          </span>
                          {/* {getTrendIcon(market.trend)} */}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSwapModalOpen(true);
                          }}
                        >
                          Swap
                          {/* <ExternalLink className="h-4 w-4 ml-2" /> */}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredMarkets.map((market) => (
              <Card key={market.symbol}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{market.icon}</div>
                      <div>
                        <div className="font-semibold">{market.asset}</div>
                        <div className="text-sm text-muted-foreground">
                          {market.symbol}
                        </div>
                      </div>
                      {market.canBeCollateral && (
                        <Badge variant="secondary" className="text-xs">
                          Collateral
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSwapModalOpen(true)}
                    >
                      Swap
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Supplied
                      </div>
                      <div className="font-semibold">
                        {formatNumber(market.totalSupplied)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {market.totalSuppliedValue}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Supply APY
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-green-600">
                          {market.supplyAPY}%
                        </span>
                        {getTrendIcon(market.trend)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Borrowed
                      </div>
                      <div className="font-semibold">
                        {market.totalBorrowed}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {market.totalBorrowedValue}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Borrow APY
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-red-600">
                          {market.borrowAPY}%
                        </span>
                        {getTrendIcon(market.trend)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMarkets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No markets found matching your search.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Modal */}
      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
      />
    </div>
  );
}
