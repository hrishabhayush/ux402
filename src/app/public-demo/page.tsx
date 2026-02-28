"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useWalletClient,
  useConnect,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { x402Client } from "@x402/core/client";
import Link from "next/link";
import { monadTestnet } from "@/config/wagmi";

const MONAD_CHAIN_ID = "eip155:10143" as const;
const MONAD_EXPLORER = "https://testnet.monadexplorer.com";

interface PaymentResult {
  content: string;
  unlockedAt: string;
  note: string;
}

export default function PublicDemo() {
  const { isConnected, address, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txInfo, setTxInfo] = useState<{
    wallet: string;
    timestamp: string;
  } | null>(null);

  const handleUnlock = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet first");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      if (chain?.id !== monadTestnet.id) {
        await switchChainAsync({ chainId: monadTestnet.id });
      }

      const wc = walletClient;
      const pc = publicClient;

      if (!wc || !pc) {
        throw new Error(
          "Wallet not available on Monad testnet. Please switch your wallet to Monad testnet and try again."
        );
      }

      const evmSigner = toClientEvmSigner(
        {
          address: address as `0x${string}`,
          signTypedData: async (message: {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
            primaryType: string;
            message: Record<string, unknown>;
          }) => {
            return wc.signTypedData({
              domain: message.domain as Parameters<
                typeof wc.signTypedData
              >[0]["domain"],
              types: message.types as Parameters<
                typeof wc.signTypedData
              >[0]["types"],
              primaryType: message.primaryType,
              message: message.message,
            });
          },
        },
        pc
      );

      const exactScheme = new ExactEvmScheme(evmSigner);
      const client = new x402Client().register(MONAD_CHAIN_ID, exactScheme);
      const paymentFetch = wrapFetchWithPayment(fetch, client);

      const response = await paymentFetch("/api/premium", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: PaymentResult = await response.json();
      setResult(data);
      setTxInfo({
        wallet: address,
        timestamp: new Date().toISOString(),
      });
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment failed";
      if (
        message.includes("User rejected") ||
        message.includes("user rejected")
      ) {
        setError("Transaction cancelled by user");
      } else {
        setError(message);
      }
      setStatus("error");
    }
  }, [walletClient, address, publicClient, chain, switchChainAsync]);

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-300">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Public x402 Payment
          </h1>
          <p className="text-zinc-400 text-sm">
            Standard x402 flow on Monad &mdash; payment is on-chain and fully
            linkable to your wallet.
          </p>
        </div>

        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injected() })}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
              <div>
                <p className="text-xs text-zinc-500">Connected Wallet</p>
                <p className="text-sm text-white font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <button
                onClick={() => disconnect()}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Disconnect
              </button>
            </div>

            {chain?.id !== monadTestnet.id && (
              <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  Wrong network — switch to Monad Testnet to pay. The button below will prompt the switch.
                </p>
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={status === "loading"}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-wait text-white font-medium rounded-lg transition-colors"
            >
              {status === "loading"
                ? "Processing payment..."
                : chain?.id !== monadTestnet.id
                  ? "Switch to Monad & Pay $0.001 USDC"
                  : "Pay $0.001 USDC to Unlock"}
            </button>
          </div>
        )}

        {status === "error" && error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {status === "success" && result && txInfo && (
          <div className="space-y-4">
            <div className="bg-green-950 border border-green-800 rounded-lg p-4 space-y-2">
              <p className="text-green-300 text-sm font-medium">
                Payment successful
              </p>
              <p className="text-green-200 text-sm">{result.content}</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
              <h3 className="text-white text-sm font-medium">
                Payment Receipt (Public / Linkable)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Wallet</span>
                  <a
                    href={`${MONAD_EXPLORER}/address/${txInfo.wallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 font-mono hover:underline"
                  >
                    {txInfo.wallet.slice(0, 6)}...{txInfo.wallet.slice(-4)}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount</span>
                  <span className="text-white">$0.001 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Network</span>
                  <span className="text-white">Monad Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Time</span>
                  <span className="text-white">
                    {new Date(txInfo.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <p className="text-yellow-500 text-xs mt-2">
                This payment is publicly visible on-chain and linked to your
                wallet address.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
