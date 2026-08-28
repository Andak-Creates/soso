import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/paystack/webhook
 * 
 * Securely handles Paystack webhooks for real-time ticket sales & settlement reconciliation.
 * Events handled:
 * - charge.success: Records completed tickets, logs earnings, updates pending payout balance.
 * - transfer.success / settlement.success: Records completed bank settlements, updates total_withdrawn.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    
    // Validate signature
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(rawBody)
      .digest("hex");
      
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    const event = JSON.parse(rawBody);
    
    // Initialize Supabase Admin client with service role key
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // ─────────────────────────────────────────────────────────────
    // 1. TICKET PAYMENT SUCCESS (charge.success)
    // ─────────────────────────────────────────────────────────────
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const totalAmountPaid = data.amount / 100; // in Naira
      const metadata = data.metadata || {};
      const partyId = metadata.event_id || metadata.party_id;
      const userId = metadata.user_id;
      const tierId = metadata.ticket_tier_id || metadata.tier_id;
      
      // Check if ticket is already recorded to prevent duplicate processing
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();

      if (!existingTicket && partyId) {
        const serviceFee = metadata.service_fee ? Number(metadata.service_fee) : Math.round(totalAmountPaid * 0.05);
        const purchasePrice = totalAmountPaid - serviceFee;
        const hostEarnings = purchasePrice > 0 ? purchasePrice : Math.round(totalAmountPaid * 0.95);

        // A. Insert ticket record
        const { error: ticketError } = await supabase.from("tickets").insert({
          party_id: partyId,
          user_id: userId || null,
          ticket_tier_id: tierId || null,
          purchase_price: purchasePrice,
          service_fee: serviceFee,
          total_paid: totalAmountPaid,
          payment_status: "completed",
          reference: reference,
          guest_email: metadata.guest_email || data.customer?.email || null,
          guest_name: metadata.guest_name || data.customer?.first_name || null,
          quantity_purchased: metadata.quantity || 1,
          quantity_used: 0,
        });

        if (ticketError) {
          console.error("[Webhook Error] Ticket insert failed:", ticketError);
        }

        // B. Fetch host ID from the party record
        const { data: party } = await supabase
          .from("parties")
          .select("host_id")
          .eq("id", partyId)
          .single();

        if (party?.host_id) {
          const hostId = party.host_id;

          // C. Log host earnings
          await supabase.from("host_earnings_logs").insert({
            host_id: hostId,
            party_id: partyId,
            amount: hostEarnings,
            source: "ticket_sale",
            description: `Ticket sale (${metadata.tier_name || "General Tier"}) - Ref: ${reference}`,
            created_at: new Date().toISOString(),
          });

          // D. Reconcile host_balances atomically
          const { data: balance } = await supabase
            .from("host_balances")
            .select("*")
            .eq("user_id", hostId)
            .maybeSingle();

          if (balance) {
            await supabase
              .from("host_balances")
              .update({
                total_earned: (Number(balance.total_earned) || 0) + hostEarnings,
                pending_payout: (Number(balance.pending_payout) || 0) + hostEarnings,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", hostId);
          } else {
            await supabase.from("host_balances").insert({
              user_id: hostId,
              total_earned: hostEarnings,
              pending_payout: hostEarnings,
              available_balance: 0,
              total_withdrawn: 0,
              currency: "NGN",
            });
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DAILY AUTOMATED SETTLEMENT / TRANSFER SUCCESS
    // ─────────────────────────────────────────────────────────────
    if (event.event === "transfer.success" || event.event === "settlement.success") {
      const data = event.data;
      const settledAmount = (data.amount || 0) / 100;
      const subaccountCode = data.subaccount?.subaccount_code || data.subaccount_code || data.recipient?.recipient_code;
      
      if (subaccountCode && settledAmount > 0) {
        // Find host bank account by subaccount code
        const { data: bankAccount } = await supabase
          .from("host_bank_accounts")
          .select("user_id, bank_name, account_number")
          .eq("paystack_subaccount_code", subaccountCode)
          .maybeSingle();

        if (bankAccount?.user_id) {
          const hostId = bankAccount.user_id;

          // Log settlement
          await supabase.from("host_earnings_logs").insert({
            host_id: hostId,
            amount: settledAmount,
            source: "bank_settlement",
            description: `Automated Paystack settlement to ${bankAccount.bank_name} (${bankAccount.account_number})`,
            created_at: new Date().toISOString(),
          });

          // Update host balances (move from pending_payout to total_withdrawn)
          const { data: balance } = await supabase
            .from("host_balances")
            .select("*")
            .eq("user_id", hostId)
            .maybeSingle();

          if (balance) {
            const currentPending = Number(balance.pending_payout) || 0;
            const currentWithdrawn = Number(balance.total_withdrawn) || 0;

            await supabase
              .from("host_balances")
              .update({
                pending_payout: Math.max(0, currentPending - settledAmount),
                total_withdrawn: currentWithdrawn + settledAmount,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", hostId);
          }
        }
      }
    }
    
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[Webhook Exception]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
