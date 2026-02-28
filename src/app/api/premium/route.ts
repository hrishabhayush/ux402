import { NextRequest, NextResponse } from "next/server";
import { withX402, type RouteConfig } from "@x402/next";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  MONAD_NETWORK,
  MONAD_USDC_ADDRESS,
  MONAD_FACILITATOR_URL,
} from "@/config/monad";

if (!process.env.PAY_TO_ADDRESS) {
  throw new Error("PAY_TO_ADDRESS environment variable is required");
}

const PAY_TO = process.env.PAY_TO_ADDRESS;

const facilitatorClient = new HTTPFacilitatorClient({
  url: MONAD_FACILITATOR_URL,
});

const server = new x402ResourceServer(facilitatorClient);

const monadScheme = new ExactEvmScheme();
monadScheme.registerMoneyParser(async (amount: number, network: string) => {
  if (network === MONAD_NETWORK) {
    const tokenAmount = Math.floor(amount * 1_000_000).toString();
    return {
      amount: tokenAmount,
      asset: MONAD_USDC_ADDRESS,
      extra: { name: "USDC", version: "2" },
    };
  }
  return null;
});

server.register(MONAD_NETWORK, monadScheme);

const routeConfig: RouteConfig = {
  accepts: {
    scheme: "exact",
    network: MONAD_NETWORK,
    payTo: PAY_TO,
    price: "$0.01",
  },
  resource: "http://localhost:3000/api/premium",
};

async function handler() {
  return NextResponse.json({
    content:
      "This is premium content unlocked via standard x402 payment on Monad.",
    unlockedAt: new Date().toISOString(),
    note: "This payment is fully on-chain and linkable to your wallet address.",
  });
}

const wrappedHandler = withX402(handler, routeConfig, server);

export async function GET(request: NextRequest) {
  const paymentHeader = request.headers.get("x-payment");
  if (paymentHeader) {
    console.log("[x402] Incoming X-PAYMENT header (first 200):", paymentHeader.slice(0, 200));
  }
  const response = await wrappedHandler(request);
  console.log("[x402] Response status:", response.status);
  if (response.status === 402) {
    const cloned = response.clone();
    const body = await cloned.text();
    console.log("[x402] 402 body:", body);
    const pr = cloned.headers.get("payment-required");
    if (pr) {
      try {
        console.log("[x402] payment-required decoded:", Buffer.from(pr, "base64").toString());
      } catch { /* */ }
    }
  }
  return response;
}
