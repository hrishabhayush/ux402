import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            x402 Payment Demo
          </h1>
          <p className="text-zinc-400">
            Compare standard (public) x402 payments with a privacy-preserving
            intent flow — both on Monad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/public-demo"
            className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-violet-500 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
              Public x402
            </h2>
            <p className="text-zinc-500 text-sm mt-2">
              Standard flow — wallet address, tx hash, and payment are all
              visible on-chain.
            </p>
            <span className="inline-block mt-4 text-xs text-violet-400 font-medium">
              Try it &rarr;
            </span>
          </Link>

          <Link
            href="/private-demo"
            className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-emerald-500 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Private x402
            </h2>
            <p className="text-zinc-500 text-sm mt-2">
              Privacy intent flow — no wallet address or on-chain receipt
              exposed. Powered by Unlink.
            </p>
            <span className="inline-block mt-4 text-xs text-emerald-400 font-medium">
              Try it &rarr;
            </span>
          </Link>
        </div>

        <p className="text-zinc-600 text-xs">
          Built with x402 protocol &middot; Monad Testnet &middot; Unlink
          Privacy
        </p>
      </div>
    </main>
  );
}
