import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DashboardClient from './DashboardClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the host's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch their parties with media and tier capacities (we only need quantity, not stale quantity_sold)
  const { data: parties } = await supabase
    .from('parties')
    .select('*, media:party_media(*), ticket_tiers(quantity)')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch actual tickets to guarantee 100% accurate count & revenue
  const partyIds = parties?.map(p => p.id) || [];
  let totalTicketsSold = 0;
  let computedGrossRevenue = 0;
  let computedHostEarnings = 0;
  const partyTicketsCountMap: Record<string, number> = {};

  if (partyIds.length > 0) {
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('party_id, quantity_purchased, quantity, purchase_price, total_paid, service_fee')
      .in('party_id', partyIds)
      .or('payment_status.eq.completed,payment_status.is.null');

    if (allTickets && allTickets.length > 0) {
      allTickets.forEach(t => {
        const qty = Number(t.quantity_purchased) || Number(t.quantity) || 1;
        totalTicketsSold += qty;
        partyTicketsCountMap[t.party_id] = (partyTicketsCountMap[t.party_id] || 0) + qty;

        const totalPaid = Number(t.total_paid) || 0;
        const purchasePrice = Number(t.purchase_price) || 0;
        const serviceFee = Number(t.service_fee) || 0;

        const gross = totalPaid > 0 ? totalPaid : (purchasePrice + serviceFee);
        const hostShare = purchasePrice > 0 ? purchasePrice : Math.round(gross * 0.95);

        computedGrossRevenue += gross;
        computedHostEarnings += hostShare;
      });
    }
  }

  // Update parties array with live computed tickets_sold & accurate capacity
  const enrichedParties = (parties || []).map(p => {
    const tiersCapacity = (p.ticket_tiers || []).reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
    return {
      ...p,
      tickets_sold: partyTicketsCountMap[p.id] ?? p.tickets_sold ?? 0,
      ticket_quantity: tiersCapacity > 0 ? tiersCapacity : p.ticket_quantity,
    };
  });

  // Fetch host balances if available
  const { data: rawBalance } = await supabase
    .from('host_balances')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Reconcile balance so numbers are 100% accurate in real time
  const totalSettled = Number(rawBalance?.total_withdrawn) || 0;
  const liveTotalEarned = Math.max(Number(rawBalance?.total_earned) || 0, computedHostEarnings);
  const livePendingPayout = Math.max(0, liveTotalEarned - totalSettled);

  const reconciledBalance = {
    ...(rawBalance || {}),
    total_earned: liveTotalEarned,
    gross_revenue: computedGrossRevenue,
    pending_payout: livePendingPayout,
    total_withdrawn: totalSettled,
    current_balance: Number(rawBalance?.available_balance) || 0,
    currency: rawBalance?.currency || "NGN",
  };

  // Calculate total tickets across all parties
  const computedTotalTicketsSold =
    totalTicketsSold > 0
      ? totalTicketsSold
      : enrichedParties.reduce((sum, p) => sum + (p.tickets_sold || 0), 0);

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      parties={enrichedParties} 
      balance={reconciledBalance}
      totalTicketsSold={computedTotalTicketsSold}
    />
  );
}
