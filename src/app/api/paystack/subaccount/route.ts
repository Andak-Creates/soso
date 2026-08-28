import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServerAuthClient } from "@/lib/supabase/server";

const PLATFORM_FEE_PERCENT = 5;

/**
 * POST /api/paystack/subaccount
 * 
 * Securely creates or updates a Paystack Subaccount for automated host payouts.
 * Binds directly to the authenticated user's verified bank account.
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bank_account_id } = body;

    if (!bank_account_id) {
      return NextResponse.json(
        { error: "bank_account_id is required" },
        { status: 400 }
      );
    }

    // Service role client to perform secure updates
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        }
      }
    );

    // Verify bank account ownership strictly
    const { data: bankAccount, error: bankError } = await supabaseAdmin
      .from("host_bank_accounts")
      .select("*")
      .eq("id", bank_account_id)
      .eq("user_id", user.id)
      .single();

    if (bankError || !bankAccount) {
      return NextResponse.json(
        { error: "Bank account record not found or access denied" },
        { status: 404 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      );
    }

    const existingSubaccountCode = bankAccount.paystack_subaccount_code;
    let subaccountCode: string;
    let isVerified = false;

    if (existingSubaccountCode) {
      // Update existing subaccount
      const updateRes = await fetch(
        `https://api.paystack.co/subaccount/${encodeURIComponent(existingSubaccountCode)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            business_name: bankAccount.account_name,
            settlement_bank: bankAccount.bank_code,
            account_number: bankAccount.account_number,
            percentage_charge: PLATFORM_FEE_PERCENT,
            description: `TheScene/SOSO Host Payout Account (${user.id})`,
          }),
        }
      );

      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.status) {
        throw new Error(updateData.message || "Paystack subaccount update failed");
      }

      subaccountCode = updateData.data.subaccount_code;
      isVerified = !!updateData.data.is_verified;
    } else {
      // Create new subaccount
      const createRes = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: bankAccount.account_name,
          settlement_bank: bankAccount.bank_code,
          account_number: bankAccount.account_number,
          percentage_charge: PLATFORM_FEE_PERCENT,
          description: `TheScene/SOSO Host Payout Account (${user.id})`,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.status) {
        throw new Error(createData.message || "Paystack subaccount creation failed");
      }

      subaccountCode = createData.data.subaccount_code;
      isVerified = !!createData.data.is_verified;
    }

    // Save subaccount code back to host_bank_accounts
    const { error: dbUpdateError } = await supabaseAdmin
      .from("host_bank_accounts")
      .update({
        paystack_subaccount_code: subaccountCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bank_account_id);

    if (dbUpdateError) {
      console.warn("[paystack/subaccount] DB subaccount code save warning:", dbUpdateError.message);
    }

    return NextResponse.json({
      success: true,
      subaccount_code: subaccountCode,
      is_verified: isVerified,
      action: existingSubaccountCode ? "updated" : "created",
    });
  } catch (err: any) {
    console.error("[paystack/subaccount] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to configure payout subaccount" },
      { status: 500 }
    );
  }
}
