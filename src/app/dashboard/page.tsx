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

  // Fetch their parties
  const { data: parties } = await supabase
    .from('parties')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Compute total tickets sold and total earnings (dummy or simple calculation for now)
  // We can join tickets or just aggregate. For now we will sum up tickets_sold in parties.
  let totalTicketsSold = 0;
  if (parties) {
    parties.forEach(p => {
      totalTicketsSold += (p.tickets_sold || 0);
    });
  }

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
      parties={parties || []} 
      balance={balance}
      totalTicketsSold={totalTicketsSold}
    />
  );
}
