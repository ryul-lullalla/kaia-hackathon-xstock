"use client";

import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";
import {
  Wallet,
  LogOut,
  Home,
  Coins,
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import ConnectButton from "@/components/wallet-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useChainId, useSwitchChain, useAccount, useDisconnect } from "wagmi";
import { KAIA_TESTNET } from "@/lib/config";
import { wagmiConfig } from "@/lib/wagmi";
import { useState } from "react";

const navigationItems = [
  { href: "/faucet", label: "Faucet", icon: Coins },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  // { href: "/market", label: "Market", icon: TrendingUp },
  { href: "/collateral", label: "Collateral", icon: Shield },
];

export function Header() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current chain is Kaia Testnet
  const isKaiaTestnet = chainId === wagmiConfig.chains[0].id;

  // Debug logging

  const handleWalletAction = async () => {
    try {
      if (isConnected) {
        await disconnect();
      } else {
        await open();
      }
    } catch (error) {
      console.error("Wallet action error:", error);
    }
  };

  const handleSwitchToKaia = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: KAIA_TESTNET.id });
      }
    } catch (error) {
      console.error("Failed to switch to Kaia Testnet:", error);
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary">kStock</h1>
            </Link>
          </div>

          <nav className="hidden xl:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4">
            {isKaiaTestnet ? (
              <Image
                src="/kaia-logo.png"
                alt="Kaia Network"
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <button
                onClick={handleSwitchToKaia}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                title="Switch to Kaia Testnet"
              >
                <AlertTriangle size={20} className="text-orange-600" />
              </button>
            )}
          </div>

          {/* Mobile hamburger menu button */}

          <ConnectButton />
          <Button
            variant="ghost"
            size="sm"
            className="xl:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 xl:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border/40 z-50 xl:hidden transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Drawer Navigation */}
            <nav className="p-4">
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
