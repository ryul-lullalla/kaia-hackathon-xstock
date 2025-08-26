// Contract addresses for Kaia Testnet
export const CONTRACTS = {
  MOCK_USDT: "0x30087C901942284a90361039ffbbDE949949C45E" as const,
  KX_APPLE: "0xa2f6E1a6F430C1Ab0E26f942a96a4F2718aeB2fB" as const,
  COLLATERAL_VAULT: "0x23dd4A8DE699635046CBb94D64B5eBA7df5f9A36" as const,
  LENDING_VAULT: "0x5738216073AE89876bBC693BcC401962ad597EA4" as const,
  PRICE_ORACLE: "0xba3D82B1AdD1C3e9CDa45c978B7b967c4d7671BD" as const,
} as const;

// Kaia Testnet configuration
export const KAIA_TESTNET = {
  id: 1001,
  name: "Kaia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "KAIA",
    symbol: "KAIA",
  },
  rpcUrls: {
    default: {
      http: ["https://archive-rpc.testnet.kaia.io"],
    },
    public: {
      http: ["https://archive-rpc.testnet.kaia.io"],
    },
  },
  blockExplorers: {
    default: { name: "KaiaScope", url: "https://baobab.klaytnscope.com" },
  },
  testnet: true,
} as const;

// App configuration
export const APP_CONFIG = {
  PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
} as const;
