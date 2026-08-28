import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import EventClient from './EventClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Ignored in Server Components */ }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Host profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // The party itself
  const { data: party, error } = await supabase
    .from('parties')
    .select('*, host_profile:host_profiles(id, name, avatar_url, is_verified)')
    .eq('id', eventId)
    .single();

  if (!party || error) {
    return <div className="p-8 text-white">Event not found.</div>;
  }

  // Run data fetches in parallel
  const [
    { data: tickets },
    { data: ticketTiers },
    { data: comments },
    { data: partyMedia },
    { data: hostBalance },
    { data: bankAccount },
    { data: hostAdmins },
    { data: earningsLogs },
  ] = await Promise.all([
    // Tickets with guest profile info & tier info — only completed payments
    supabase
      .from('tickets')
      .select('*, profiles(id, username, full_name, avatar_url), ticket_tiers(id, name, price, tier_type)')
      .eq('party_id', eventId)
      .or('payment_status.eq.completed,payment_status.is.null')
      .order('purchased_at', { ascending: false }),

    // Ticket tiers for this event
    supabase
      .from('ticket_tiers')
      .select('*')
      .eq('party_id', eventId)
      .order('tier_order', { ascending: true }),

    // Comments
    supabase
      .from('party_comments')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('party_id', eventId)
      .order('created_at', { ascending: false }),

    // Party media (for flyer/gallery)
    supabase
      .from('party_media')
      .select('*')
      .eq('party_id', eventId)
      .order('display_order', { ascending: true }),

    // Host's balance across all events
    supabase
      .from('host_balances')
      .select('*')
      .eq('user_id', user.id)
      .single(),

    // Host's primary payout bank account
    supabase
      .from('host_bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    // Door staff already assigned to the host profile associated with this party
    supabase
      .from('host_admins')
      .select('*, profiles(id, username, full_name, avatar_url)')
      .eq('host_profile_id', party.host_profile_id || '00000000-0000-0000-0000-000000000000'),

    // Earnings logs for this specific party (for revenue breakdown)
    supabase
      .from('host_earnings_logs')
      .select('*')
      .eq('party_id', eventId)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <EventClient 
      eventId={eventId}
      user={user} 
      profile={profile} 
      party={party} 
      tickets={tickets || []}
      ticketTiers={ticketTiers || []}
      comments={comments || []}
      partyMedia={partyMedia || []}
      hostBalance={hostBalance || null}
      bankAccount={bankAccount || null}
      hostAdmins={hostAdmins || []}
      earningsLogs={earningsLogs || []}
    />
  );
}
