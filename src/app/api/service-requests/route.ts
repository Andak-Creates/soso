import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      eventId,
      eventTitle,
      requestType,
      details,
      hostName,
      hostEmail,
      hostPhone,
    } = body;

    if (!eventId || !requestType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Auto-fetch host's verified contact details from host_verifications and profiles
    const { data: verProfile } = await supabase
      .from('host_verifications')
      .select('phone, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, username')
      .eq('id', user.id)
      .maybeSingle();

    const resolvedName = hostName || verProfile?.full_name || userProfile?.full_name || userProfile?.username || 'Host';
    const resolvedPhone = hostPhone || verProfile?.phone || userProfile?.phone || null;
    const resolvedEmail = hostEmail || user.email || null;

    const { data, error } = await supabase
      .from('event_service_requests')
      .insert({
        event_id: eventId,
        host_id: user.id,
        request_type: requestType,
        status: 'pending',
        event_title: eventTitle || null,
        host_name: resolvedName,
        host_email: resolvedEmail,
        host_phone: resolvedPhone,
        details: details || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[Service Request API Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify all admins via in-app notifications
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true);

      if (admins && admins.length > 0) {
        const isUsher = requestType === 'ushers';
        const notifTitle = isUsher
          ? `🛡️ New Usher Request: ${eventTitle || 'Event'}`
          : `🪬 New Wristband Order: ${eventTitle || 'Event'}`;

        const notifBody = isUsher
          ? `${resolvedName} requested ${details?.staffCount || ''} ushers (${details?.genderPref || 'mixed'} gender) at ₦${(details?.offeredPrice || 0).toLocaleString()}/usher. Phone: ${resolvedPhone || 'N/A'}`
          : `${resolvedName} ordered ${details?.quantity || ''} ${details?.productName || 'wristbands'} (Est: ₦${(details?.totalCost || 0).toLocaleString()}). Address: ${details?.deliveryAddress || 'N/A'}. Phone: ${resolvedPhone || 'N/A'}`;

        const adminNotifications = admins.map((admin) => ({
          user_id: admin.id,
          title: notifTitle,
          body: notifBody,
          type: 'admin_notification',
          data: {
            request_id: data.id,
            request_type: requestType,
            event_id: eventId,
            host_id: user.id,
            host_name: resolvedName,
            host_phone: resolvedPhone,
            host_email: resolvedEmail,
            details,
            admin_alert: true,
          },
          is_read: false,
        }));

        await supabase.from('notifications').insert(adminNotifications);
      }
    } catch (notifErr) {
      console.error('[Service Request Admin Notification Error]', notifErr);
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    console.error('[Service Request Error]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to submit service request' },
      { status: 500 }
    );
  }
}
