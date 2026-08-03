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

  // Fetch the party
  const { data: party, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!party || error) {
    return <div className="p-8 text-white">Event not found.</div>;
  }

  // Fetch tickets for this party
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('party_id', eventId);

  // Fetch ticket tiers (if any)
  const { data: ticketTiers } = await supabase
    .from('ticket_tiers')
    .select('*')
    .eq('party_id', eventId);

  // Fetch comments
  const { data: comments } = await supabase
    .from('party_comments')
    .select('*, profiles(username, full_name, avatar_url)')
    .eq('party_id', eventId)
    .order('created_at', { ascending: false });

  return (
    <EventClient 
      eventId={eventId}
      user={user} 
      profile={profile} 
      party={party} 
      tickets={tickets || []}
      ticketTiers={ticketTiers || []}
      comments={comments || []}
    />
  );
}
