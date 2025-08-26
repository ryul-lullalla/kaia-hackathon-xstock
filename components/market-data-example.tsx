"use client";

import { useAccount } from "wagmi";
import { useMarketData, useCompleteMarketData } from "@/hooks/useMarketData";
import { Card } from "@/components/ui/card";

/**
 * Example component demonstrating how to use the useMarketData hook
 * Shows supply APY, borrow APY, and other market metrics
 */
export function MarketDataExample() {
  const { address } = useAccount();
  const { marketData, userData, isLoading, error } =
    useCompleteMarketData(address);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Market Data</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Market Data Error
        </h2>
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Market Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600 mb-1">
              Supply APY
            </h3>
            <p className="text-2xl font-bold text-green-700">
              {marketData.formattedSupplyAPY}%
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600 mb-1">
              Borrow APY
            </h3>
            <p className="text-2xl font-bold text-blue-700">
              {marketData.formattedBorrowAPY}%
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600 mb-1">
              Utilization Rate
            </h3>
            <p className="text-2xl font-bold text-purple-700">
              {marketData.formattedUtilizationRate}%
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Total Supplied
            </h3>
            <p className="text-2xl font-bold text-gray-700">
              {parseFloat(marketData.formattedTotalAssets).toLocaleString()}{" "}
              USDT
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Total Borrowed
            </h4>
            <p className="text-lg font-semibold">
              {parseFloat(marketData.formattedTotalBorrows).toLocaleString()}{" "}
              USDT
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Available to Borrow
            </h4>
            <p className="text-lg font-semibold">
              {(
                parseFloat(marketData.formattedTotalAssets) -
                parseFloat(marketData.formattedTotalBorrows)
              ).toLocaleString()}{" "}
              USDT
            </p>
          </div>
        </div>
      </Card>

      {/* User Position (only show if user is connected) */}
      {address && userData && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Your Position</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600 mb-1">
                Supplied
              </h3>
              <p className="text-xl font-bold text-green-700">
                {parseFloat(
                  userData.formattedUserSuppliedAssets
                ).toLocaleString()}{" "}
                USDT
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-600 mb-1">
                Borrowed
              </h3>
              <p className="text-xl font-bold text-red-700">
                {parseFloat(
                  userData.formattedUserBorrowedAssets
                ).toLocaleString()}{" "}
                USDT
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600 mb-1">
                Collateral
              </h3>
              <p className="text-xl font-bold text-blue-700">
                {parseFloat(
                  userData.formattedUserCollateralAmount
                ).toLocaleString()}{" "}
                kxApple
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-2">
              Health Status:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                userData.isHealthy
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {userData.isHealthy ? "Healthy" : "At Risk"}
            </span>
          </div>
        </Card>
      )}

      {/* Technical Details */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Technical Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Interest Rate Model
            </h4>
            <ul className="space-y-1 text-gray-600">
              <li>
                Base Rate:{" "}
                {(
                  ((Number(marketData.baseRatePerSecond) *
                    Number(marketData.secondsPerYear)) /
                    Math.pow(10, 18)) *
                  100
                ).toFixed(4)}
                %
              </li>
              <li>
                Slope 1:{" "}
                {(
                  ((Number(marketData.slope1PerSecond) *
                    Number(marketData.secondsPerYear)) /
                    Math.pow(10, 18)) *
                  100
                ).toFixed(4)}
                %
              </li>
              <li>
                Slope 2:{" "}
                {(
                  ((Number(marketData.slope2PerSecond) *
                    Number(marketData.secondsPerYear)) /
                    Math.pow(10, 18)) *
                  100
                ).toFixed(4)}
                %
              </li>
              <li>
                Optimal Utilization:{" "}
                {(
                  (Number(marketData.optimalUtilization) / Math.pow(10, 18)) *
                  100
                ).toFixed(2)}
                %
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Current Rates (per second)
            </h4>
            <ul className="space-y-1 text-gray-600">
              <li>
                Borrow Rate: {Number(marketData.borrowRatePerSecond).toString()}
              </li>
              <li>
                Supply Rate: {Number(marketData.supplyRatePerSecond).toString()}
              </li>
              <li>
                Seconds Per Year:{" "}
                {Number(marketData.secondsPerYear).toLocaleString()}
              </li>
              <li>
                Last Accrual:{" "}
                {new Date(
                  Number(marketData.lastAccrual) * 1000
                ).toLocaleString()}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Simplified component that just shows APY data
 */
export function ApyDisplay() {
  const marketData = useMarketData();

  if (marketData.isLoading) {
    return <div className="text-gray-500">Loading APY data...</div>;
  }

  if (marketData.error) {
    return <div className="text-red-500">Error: {marketData.error}</div>;
  }

  return (
    <div className="flex gap-4">
      <div className="text-center">
        <div className="text-sm text-green-600 font-medium">Supply APY</div>
        <div className="text-2xl font-bold text-green-700">
          {marketData.formattedSupplyAPY}%
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm text-blue-600 font-medium">Borrow APY</div>
        <div className="text-2xl font-bold text-blue-700">
          {marketData.formattedBorrowAPY}%
        </div>
      </div>
    </div>
  );
}
