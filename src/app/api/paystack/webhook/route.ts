import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/paystack/webhook
 * 
 * Paystack sends a POST request here when events occur (e.g., charge.success).
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
    
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // back to Naira
      const metadata = data.metadata;
      
      if (metadata && metadata.event_id && metadata.user_id && metadata.ticket_tier_id) {
        // Initialize Supabase Admin client to bypass RLS for webhook updates
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!, // Webhooks need service role key to insert securely
          {
            cookies: {
              getAll() { return [] },
              setAll() {},
            }
          }
        );
        
        // Insert ticket record (maps to the 'tickets' table in the schema)
        const serviceFee = metadata.service_fee ? Number(metadata.service_fee) : 0;
        const purchasePrice = amount - serviceFee;
        const { error } = await supabase.from('tickets').insert({
          party_id: metadata.event_id,       // schema uses party_id, not event_id
          user_id: metadata.user_id || null,
          ticket_tier_id: metadata.ticket_tier_id || null,
          purchase_price: purchasePrice,
          service_fee: serviceFee,
          total_paid: amount,
          payment_status: 'completed',       // schema constraint: 'pending' | 'completed' | 'refunded'
          reference: reference,              // schema column is 'reference', not 'paystack_ref'
          guest_email: metadata.guest_email || null,
          guest_name: metadata.guest_name || null,
          quantity_purchased: metadata.quantity || 1,
          quantity_used: 0,
        });
        
        if (error) {
          console.error("[Webhook Error] DB Insert failed:", error);
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
        
        // Decrease ticket tier remaining count
        // Note: typically this requires an RPC or transaction for concurrency,
        // but for now we'll do a simple update (if supported by logic).
      }
    }
    
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[Webhook Exception]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
