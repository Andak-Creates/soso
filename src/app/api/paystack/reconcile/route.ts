import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/paystack/reconcile
 * 
 * Reconciles a Paystack transaction by reference.
 * - Verifies the transaction directly with Paystack's official API
 * - If the ticket is missing (e.g. dropped webhook), it creates the ticket, logs host earnings,
 *   credits host_balances, and triggers the ticket email.
 * - If the ticket already exists, it re-dispatches the QR ticket confirmation email.
 * 
 * Body: { reference: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference || typeof reference !== "string") {
      return NextResponse.json(
        { error: "A valid Paystack transaction reference is required." },
        { status: 400 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error("[Paystack Reconcile] Missing PAYSTACK_SECRET_KEY in environment");
      return NextResponse.json(
        { error: "Paystack secret key is not configured on server." },
        { status: 500 }
      );
    }

    // 1. Verify transaction with Paystack API
    const trimmedRef = reference.trim();
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(trimmedRef)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json(
        {
          error: paystackData.message || "Failed to verify transaction with Paystack.",
        },
        { status: paystackRes.status || 400 }
      );
    }

    const tx = paystackData.data;

    // Ensure the transaction actually succeeded
    if (tx.status !== "success") {
      return NextResponse.json(
        {
          error: `Transaction status is '${tx.status}', not 'success'. Gateway response: ${tx.gateway_response || "N/A"}`,
        },
        { status: 400 }
      );
    }

    const totalAmountPaid = (tx.amount || 0) / 100; // convert kobo to Naira
    const metadata = tx.metadata || {};
    const partyId = metadata.event_id || metadata.party_id;
    const tierId = metadata.ticket_tier_id || metadata.tier_id;
    const userId = metadata.user_id || null;
    const guestEmail = metadata.guest_email || tx.customer?.email || null;
    const guestName =
      metadata.guest_name ||
      (tx.customer?.first_name ? `${tx.customer.first_name} ${tx.customer.last_name || ""}`.trim() : "Guest");
    const quantity = Number(metadata.quantity) || 1;
    const tierName = metadata.tier_name || "General Admission";

    if (!partyId) {
      return NextResponse.json(
        {
          error: "Party / Event ID is missing from this transaction's metadata.",
          transaction: tx,
        },
        { status: 400 }
      );
    }

    // 2. Initialize Supabase Admin Client (Service Role)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    // Fetch Party Details
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("id, title, date, location, city, currency_code, host_id")
      .eq("id", partyId)
      .maybeSingle();

    if (partyError || !party) {
      return NextResponse.json(
        { error: "Associated event was not found in the database." },
        { status: 404 }
      );
    }

    // 3. Check if ticket is already recorded
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select("*")
      .eq("reference", trimmedRef)
      .maybeSingle();

    if (existingTicket) {
      // Re-dispatch confirmation email
      const { error: emailError } = await supabase.functions.invoke(
        "send-ticket-email",
        {
          body: {
            ticketId: existingTicket.id,
            partyId: party.id,
            guestEmail: existingTicket.guest_email || guestEmail,
            guestName: existingTicket.guest_name || guestName,
            partyTitle: party.title,
            partyDate: party.date,
            partyLocation: party.location,
            partyCity: party.city || null,
            tierName,
            quantity: existingTicket.quantity_purchased || quantity,
            totalPaid: existingTicket.total_paid || totalAmountPaid,
            currency: party.currency_code || "NGN",
            isConcierge: false,
          },
        }
      );

      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        message: "Ticket was already recorded in the database. Confirmation email re-dispatched to guest.",
        ticket: existingTicket,
        emailError: emailError ? emailError.message : null,
      });
    }

    // 4. Ticket was NOT found — Create ticket and credit host balance
    const serviceFee = metadata.service_fee
      ? Number(metadata.service_fee)
      : Math.round(totalAmountPaid * 0.05);
    const purchasePrice = totalAmountPaid - serviceFee;
    const hostEarnings = purchasePrice > 0 ? purchasePrice : Math.round(totalAmountPaid * 0.95);

    // A. Insert ticket
    const { data: newTicket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        party_id: partyId,
        user_id: userId,
        ticket_tier_id: tierId || null,
        purchase_price: purchasePrice,
        service_fee: serviceFee,
        total_paid: totalAmountPaid,
        payment_status: "completed",
        reference: trimmedRef,
        guest_email: guestEmail,
        guest_name: guestName,
        quantity_purchased: quantity,
        quantity_used: 0,
      })
      .select()
      .single();

    if (ticketError) {
      console.error("[Paystack Reconcile] Failed to insert ticket:", ticketError);
      return NextResponse.json(
        { error: "Failed to create ticket record: " + ticketError.message },
        { status: 500 }
      );
    }

    // B. Log Host Earnings & Update Host Balances
    if (party.host_id) {
      const hostId = party.host_id;

      await supabase.from("host_earnings_logs").insert({
        host_id: hostId,
        party_id: partyId,
        amount: hostEarnings,
        source: "ticket_sale",
        description: `Reconciled ticket sale (${tierName}) - Ref: ${trimmedRef}`,
        created_at: new Date().toISOString(),
      });

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
          currency: party.currency_code || "NGN",
        });
      }
    }

    // C. Dispatch Ticket Email
    const { error: emailError } = await supabase.functions.invoke(
      "send-ticket-email",
      {
        body: {
          ticketId: newTicket.id,
          partyId: party.id,
          guestEmail,
          guestName,
          partyTitle: party.title,
          partyDate: party.date,
          partyLocation: party.location,
          partyCity: party.city || null,
          tierName,
          quantity,
          totalPaid: totalAmountPaid,
          currency: party.currency_code || "NGN",
          isConcierge: false,
        },
      }
    );

    return NextResponse.json({
      success: true,
      alreadyExisted: false,
      message: "Transaction successfully reconciled! Ticket created, host balance credited, and email sent.",
      ticket: newTicket,
      emailError: emailError ? emailError.message : null,
    });
  } catch (err: any) {
    console.error("[Paystack Reconcile Exception]:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while reconciling transaction." },
      { status: 500 }
    );
  }
}
