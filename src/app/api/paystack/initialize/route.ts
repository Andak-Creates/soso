import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/paystack/initialize
 *
 * Initializes a Paystack payment on behalf of a ticket buyer.
 * The Paystack secret key is ONLY accessed here — never exposed to the client.
 *
 * Body: { email: string, amount: number (kobo), metadata: object, callback_url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, metadata, callback_url, subaccount, bearer, transaction_charge } = body;

    if (!email || !amount) {
      return NextResponse.json(
        { error: "email and amount are required" },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      email,
      amount: Math.round(amount), // must be in kobo (₦1 = 100 kobo)
      metadata: metadata ?? {},
      callback_url: callback_url ?? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      channels: ["card", "bank", "ussd", "mobile_money"],
    };

    // Attach subaccount split if host has an active payout subaccount
    if (subaccount && typeof subaccount === "string" && subaccount.startsWith("ACCT_")) {
      payload.subaccount = subaccount;
      if (bearer === "account" || bearer === "subaccount") {
        payload.bearer = bearer;
      }
      if (transaction_charge && Number.isInteger(transaction_charge)) {
        payload.transaction_charge = transaction_charge;
      }
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        { error: data.message ?? "Paystack initialization failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("[paystack/initialize]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
