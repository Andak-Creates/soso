-- Migration: Ensure host_earnings_logs cannot have duplicate records for the same ticket
CREATE UNIQUE INDEX IF NOT EXISTS idx_host_earnings_logs_unique_ticket_id 
ON public.host_earnings_logs (ticket_id) 
WHERE ticket_id IS NOT NULL;
