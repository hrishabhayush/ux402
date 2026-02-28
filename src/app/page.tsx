import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            x402 Payment Demo
          </h1>
          <p className="text-zinc-400">
            Pay-per-query AI powered by x402 micropayments on Monad — each
            request settled on-chain via the facilitator.
          </p>
        </div>

        <Link
          href="/public-demo"
          className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-violet-500 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
            Pay-per-Query AI
          </h2>
          <p className="text-zinc-500 text-sm mt-2">
            Ask a question, pay $0.01 USDC, get an AI response — payment
            settled on-chain via x402.
          </p>
          <span className="inline-block mt-4 text-xs text-violet-400 font-medium">
            Try it &rarr;
          </span>
        </Link>

        <p className="text-zinc-600 text-xs">
          Built with x402 protocol &middot; Monad Testnet
        </p>
      </div>
    </main>
  );
}
