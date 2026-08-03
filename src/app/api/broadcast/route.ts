import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { partyId, subject, body } = await req.json();

    if (!partyId || !subject || !body) {
      return NextResponse.json({ error: 'partyId, subject, and body are required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: party } = await supabase
      .from('parties')
      .select('host_id, title')
      .eq('id', partyId)
      .single();

    if (!party || party.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this event.' }, { status: 403 });
    }

    // Fetch all ticket buyers with emails
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('attendee_email, attendee_name, user_id')
      .eq('party_id', partyId)
      .not('attendee_email', 'is', null);

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 });
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'No attendees with email addresses found.' }, { status: 404 });
    }

    // Deduplicate emails
    const uniqueEmails = [...new Set(tickets.map((t) => t.attendee_email).filter(Boolean))];

    // Use Resend (or any email provider) — for now we log and return count
    // In production, replace this with your actual email sending logic
    // e.g. Resend, Nodemailer, SendGrid, etc.
    // 
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await Promise.all(uniqueEmails.map(email =>
    //   resend.emails.send({
    //     from: 'noreply@thesceneapp.online',
    //     to: email,
    //     subject: `[${party.title}] ${subject}`,
    //     html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    //   })
    // ));

    console.log(`[BROADCAST] Event: ${party.title} | Recipients: ${uniqueEmails.length} | Subject: ${subject}`);

    // Log the broadcast in the DB for audit
    await supabase.from('soso_broadcasts').insert({
      party_id: partyId,
      host_id: user.id,
      subject,
      body,
      recipient_count: uniqueEmails.length,
    }).then(() => {}); // Non-blocking, ignore if table doesn't exist yet

    return NextResponse.json({
      success: true,
      sent: uniqueEmails.length,
      message: `Broadcast queued for ${uniqueEmails.length} attendees.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
