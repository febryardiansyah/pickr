"use client";

import { type ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WalletGate from "@/components/global/WalletGate";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [
    injected(),
    coinbaseWallet({
      appName:
        process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ?? "Onchain Raffle",
    }),
  ],
});

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {props.children}
            <WalletGate />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
}
