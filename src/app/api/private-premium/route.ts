import { NextRequest, NextResponse } from "next/server";

const usedNullifiers = new Set<string>();

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyProof(
  commitment: string,
  nullifier: string,
  secret: string
): Promise<{ valid: boolean; reason?: string }> {
  if (usedNullifiers.has(nullifier)) {
    return { valid: false, reason: "Nullifier already used (replay detected)" };
  }

  const expectedCommitment = await sha256Hex(secret + nullifier);
  if (expectedCommitment !== commitment) {
    return { valid: false, reason: "Commitment mismatch — invalid proof" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { commitment, nullifier, secret } = await request.json();

    if (!commitment || !nullifier || !secret) {
      return NextResponse.json(
        { error: "Missing commitment, nullifier, or secret" },
        { status: 400 }
      );
    }

    const { valid, reason } = await verifyProof(commitment, nullifier, secret);

    if (!valid) {
      return NextResponse.json({ error: reason }, { status: 403 });
    }

    usedNullifiers.add(nullifier);

    return NextResponse.json({
      content:
        "This is premium content unlocked via private intent on Monad. No wallet address or tx hash was recorded.",
      unlockedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
