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

  // Fetch their parties with media and ticket counts
  const { data: parties } = await supabase
    .from('parties')
    .select('*, media:party_media(*), ticket_tiers(quantity_sold, quantity)')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch actual tickets to guarantee 100% accurate count
  const partyIds = parties?.map(p => p.id) || [];
  let totalTicketsSold = 0;
  const partyTicketsCountMap: Record<string, number> = {};

  if (partyIds.length > 0) {
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('party_id, quantity_purchased')
      .in('party_id', partyIds);

    if (allTickets && allTickets.length > 0) {
      allTickets.forEach(t => {
        const qty = Number(t.quantity_purchased) || 1;
        totalTicketsSold += qty;
        partyTicketsCountMap[t.party_id] = (partyTicketsCountMap[t.party_id] || 0) + qty;
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
  const { data: balance } = await supabase
    .from('host_balances')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      parties={enrichedParties} 
      balance={balance}
      totalTicketsSold={totalTicketsSold}
    />
  );
}
