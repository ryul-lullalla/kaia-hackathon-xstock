"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Shield,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLendingVaultViewFunctions } from "@/hooks/use-contracts";
import { useAccount } from "wagmi";

const features = [
  {
    title: "Markets Overview",
    description:
      "Explore all available markets and see real-time lending and borrowing data.",
    icon: BarChart3,
    href: "/markets",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "kxApple Market",
    description:
      "Supply, borrow, and trade kxApple tokens in our unified market interface.",
    icon: TrendingUp,
    href: "/market",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Get Free Tokens",
    description:
      "Start by minting free kxApple tokens from our faucet to explore the protocol.",
    icon: Coins,
    href: "/faucet",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    title: "Supply Collateral",
    description:
      "Deposit USDT as collateral to unlock borrowing capabilities and earn yield.",
    icon: Shield,
    href: "/collateral",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
];

// Static fallback stats
const fallbackStats = [
  { label: "Total Value Locked", value: "$2.4M", change: "+12.5%" },
  { label: "Total Borrowed", value: "$1.8M", change: "+8.3%" },
  { label: "Active Users", value: "1,234", change: "+15.2%" },
  { label: "Current APY", value: "5.2%", change: "+0.3%" },
];

export default function Home() {
  const { address } = useAccount();

  // Test the new lending vault view functions hook
  const lendingVaultData = useLendingVaultViewFunctions(address);

  // Create dynamic stats using real data from the hook
  const stats = [
    {
      label: "Total Assets",
      value: `${lendingVaultData.formattedTotalAssets} USDT`,
      change: "+12.5%",
    },
    {
      label: "Total Borrowed",
      value: `${lendingVaultData.formattedTotalBorrows} USDT`,
      change: "+8.3%",
    },
    {
      label: "Borrow Cap",
      value: `${lendingVaultData.formattedBorrowCap} USDT`,
      change: "Cap",
    },
    {
      label: "Min Cash",
      value: `${lendingVaultData.formattedMinCash} USDT`,
      change: "Reserve",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Welcome to <span className="text-primary">xStock</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A decentralized lending protocol built on Kaia Network. Supply
            liquidity, borrow against collateral, and earn yield on your digital
            assets.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/markets">
              View Markets <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/market">Trade kxApple</Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Debug Section - Display current user data if connected */}
      {address && (
        <section className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Your Account Data (Check Console for Full Details)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Your Balance</p>
              <p className="font-mono">
                {lendingVaultData.formattedBalanceOf} USDT
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Assets</p>
              <p className="font-mono">
                {lendingVaultData.formattedAssetsOf} USDT
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Debt</p>
              <p className="font-mono">
                {lendingVaultData.formattedDebtOf} USDT
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Collateral</p>
              <p className="font-mono">
                {lendingVaultData.formattedCollateralAmount} USDT
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            📱 Open browser console (F12) to see all lending vault view function
            data
          </p>
        </section>
      )}

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Core Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore all the features that make xStock a comprehensive DeFi
            platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={feature.href}>
                      Go to {feature.title}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with xStock in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Connect & Get Tokens</h3>
            <p className="text-muted-foreground">
              Connect your wallet and mint free kxApple tokens from our faucet
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Supply or Deposit</h3>
            <p className="text-muted-foreground">
              Provide liquidity to earn yield or deposit collateral to borrow
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Earn & Grow</h3>
            <p className="text-muted-foreground">
              Watch your assets grow with competitive yields and flexible
              borrowing
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
