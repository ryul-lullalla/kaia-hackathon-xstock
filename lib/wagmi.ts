import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { kairos } from "viem/chains";
import { http } from "wagmi";
import { cookieStorage, createStorage } from "@wagmi/core";

// 1. Get projectId from https://cloud.reown.com
const projectId = "3ebf6c45dbcb47c0625efabd60cbdd48";

// 2. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: [
    {
      ...kairos,
      rpcUrls: {
        default: {
          http: ["https://kaia-kairos.blockpi.network/v1/rpc/public"],
        },
      },
    },
  ],
});

// 3. Create AppKit instance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [kairos],
  defaultNetwork: kairos,
  metadata: {
    name: "xStock",
    description: "Lending and borrowing platform on Kaia Network",
    url: "https://kx-finance.vercel.app", // your app's url
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  features: {
    analytics: true,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
