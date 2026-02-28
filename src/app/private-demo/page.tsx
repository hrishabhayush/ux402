"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface PrivatePaymentResult {
  content: string;
  unlockedAt: string;
}

export default function PrivateDemo() {
  const [status, setStatus] = useState<
    "idle" | "generating" | "submitting" | "success" | "error"
  >("idle");
  const [secret, setSecret] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [result, setResult] = useState<PrivatePaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateIntent = useCallback(async () => {
    setStatus("generating");
    setError(null);

    try {
      const newSecret = generateRandomHex(32);
      const newNullifier = generateRandomHex(32);
      const commitmentHash = await sha256Hex(newSecret + newNullifier);

      setSecret(newSecret);
      setNullifier(newNullifier);
      setCommitment(commitmentHash);
      setStatus("idle");
    } catch {
      setError("Failed to generate intent");
      setStatus("error");
    }
  }, []);

  const handleSubmitProof = useCallback(async () => {
    if (!secret || !commitment || !nullifier) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/private-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitment, nullifier, secret }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      const data: PrivatePaymentResult = await response.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Proof verification failed"
      );
      setStatus("error");
    }
  }, [secret, commitment, nullifier]);

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-300">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Private x402 Payment
          </h1>
          <p className="text-zinc-400 text-sm">
            Privacy-preserving intent flow via Unlink on Monad &mdash; no wallet
            address or on-chain receipt exposed.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGenerateIntent}
            disabled={status === "generating"}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-wait text-white font-medium rounded-lg transition-colors"
          >
            {status === "generating"
              ? "Generating..."
              : "1. Generate Private Intent"}
          </button>

          {commitment && (
            <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
              <h3 className="text-white text-sm font-medium">
                Intent Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-zinc-500 block">Commitment</span>
                  <span className="text-emerald-400 font-mono text-xs break-all">
                    0x{commitment}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Nullifier</span>
                  <span className="text-emerald-400 font-mono text-xs break-all">
                    0x{nullifier}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Secret</span>
                  <span className="text-zinc-600 font-mono text-xs break-all">
                    (hidden — kept locally)
                  </span>
                </div>
              </div>
              <p className="text-zinc-500 text-xs">
                No wallet address is attached to this intent.
              </p>
            </div>
          )}

          {commitment && (
            <button
              onClick={handleSubmitProof}
              disabled={status === "submitting"}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-wait text-white font-medium rounded-lg transition-colors"
            >
              {status === "submitting"
                ? "Verifying proof..."
                : "2. Submit Proof & Unlock"}
            </button>
          )}
        </div>

        {status === "error" && error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-4">
            <div className="bg-emerald-950 border border-emerald-800 rounded-lg p-4 space-y-2">
              <p className="text-emerald-300 text-sm font-medium">
                Content unlocked privately
              </p>
              <p className="text-emerald-200 text-sm">{result.content}</p>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
              <h3 className="text-white text-sm font-medium">
                Privacy Summary
              </h3>
              <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                <li>No wallet address recorded</li>
                <li>No on-chain transaction receipt</li>
                <li>Nullifier consumed (replay-proof)</li>
                <li>Payment verified via commitment proof</li>
              </ul>
              <p className="text-emerald-500 text-xs mt-2">
                This payment cannot be linked back to your identity.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
