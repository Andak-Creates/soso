import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/paystack/resolve-account
 * 
 * Securely verifies a Nigerian NUBAN bank account number against the official CBN registry via Paystack.
 * Requires an authenticated user session.
 * 
 * Body: { account_number: string, bank_code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { account_number, bank_code } = body;

    // Strict input validation
    if (!account_number || !bank_code) {
      return NextResponse.json(
        { error: "account_number and bank_code are required" },
        { status: 400 }
      );
    }

    const cleanAccountNumber = String(account_number).trim();
    const cleanBankCode = String(bank_code).trim();

    if (!/^\d{10}$/.test(cleanAccountNumber)) {
      return NextResponse.json(
        { error: "Account number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    if (!/^[0-9a-zA-Z]{3,10}$/.test(cleanBankCode)) {
      return NextResponse.json(
        { error: "Invalid bank code format" },
        { status: 400 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error("[paystack/resolve-account] Missing PAYSTACK_SECRET_KEY in environment");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    const paystackUrl = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
      cleanAccountNumber
    )}&bank_code=${encodeURIComponent(cleanBankCode)}`;

    const response = await fetch(paystackUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          error: data.message || "Could not resolve bank account details. Please verify your account number and bank.",
          resolved: false,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      resolved: true,
      account_name: data.data.account_name,
      account_number: data.data.account_number,
      bank_id: data.data.bank_id,
    });
  } catch (err: any) {
    console.error("[paystack/resolve-account] Error:", err);
    return NextResponse.json(
      { error: "Failed to resolve account. Please try again later." },
      { status: 500 }
    );
  }
}
