-- Create event_service_requests table for storing Usher Staffing and Wristband orders directly in Supabase
CREATE TABLE IF NOT EXISTS public.event_service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'ushers' | 'wristbands'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'contacted' | 'fulfilled' | 'cancelled'
  event_title TEXT,
  host_name TEXT,
  host_email TEXT,
  host_phone TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_service_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated hosts to insert their own requests
CREATE POLICY "Hosts can insert service requests"
  ON public.event_service_requests
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Allow authenticated hosts to view their own service requests
CREATE POLICY "Hosts can view own service requests"
  ON public.event_service_requests
  FOR SELECT
  USING (auth.uid() = host_id);

-- Allow admins / service role full access
CREATE POLICY "Service role full access on service requests"
  ON public.event_service_requests
  FOR ALL
  USING (true);
