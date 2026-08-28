-- ==============================================================================
-- Secure Host Paystack Subaccount Retrieval Functions (SECURITY DEFINER)
-- 
-- Allows checkout flows (guest buyers and attendees) to retrieve ONLY the 
-- Paystack subaccount code (e.g., 'ACCT_xxx') necessary for revenue splitting
-- without exposing sensitive host bank credentials (account number, bank code, etc.)
-- ==============================================================================

-- 1. Get host subaccount code by Party/Event ID
CREATE OR REPLACE FUNCTION get_host_subaccount_for_party(p_party_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subaccount_code TEXT;
BEGIN
  SELECT hba.paystack_subaccount_code
  INTO v_subaccount_code
  FROM parties p
  JOIN host_bank_accounts hba ON hba.user_id = p.host_id
  WHERE p.id = p_party_id
    AND hba.is_active = true
    AND hba.paystack_subaccount_code IS NOT NULL
  ORDER BY hba.created_at DESC
  LIMIT 1;

  RETURN v_subaccount_code;
END;
$$;

-- 2. Get host subaccount code by Host User ID
CREATE OR REPLACE FUNCTION get_host_subaccount_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subaccount_code TEXT;
BEGIN
  SELECT hba.paystack_subaccount_code
  INTO v_subaccount_code
  FROM host_bank_accounts hba
  WHERE hba.user_id = p_user_id
    AND hba.is_active = true
    AND hba.paystack_subaccount_code IS NOT NULL
  ORDER BY hba.created_at DESC
  LIMIT 1;

  RETURN v_subaccount_code;
END;
$$;

-- Grant execute permissions to anonymous and authenticated users for checkout
GRANT EXECUTE ON FUNCTION get_host_subaccount_for_party(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_host_subaccount_for_user(UUID) TO anon, authenticated, service_role;
