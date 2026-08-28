-- ==============================================================================
-- Updated Subaccount Lookup: Restrict Daily Payouts to Admin-Verified Hosts Only
-- 
-- Unverified hosts: Returns NULL -> 100% of funds stay on platform escrow 
-- until the event ends or admin approves verification.
-- 
-- Verified hosts: Returns ACCT_xxx -> Receives automated daily (T+1) subaccount settlements.
-- ==============================================================================

-- 1. Get host subaccount code by Party ID (only if host is verified)
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
  JOIN profiles pr ON pr.id = p.host_id
  JOIN host_bank_accounts hba ON hba.user_id = p.host_id
  WHERE p.id = p_party_id
    AND hba.is_active = true
    AND hba.paystack_subaccount_code IS NOT NULL
    -- Must be approved/verified by admin
    AND (
      pr.host_verification_status = 'approved' 
      OR pr.host_verified_at IS NOT NULL
    )
  ORDER BY hba.created_at DESC
  LIMIT 1;

  RETURN v_subaccount_code;
END;
$$;

-- 2. Get host subaccount code by User ID (only if host is verified)
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
  JOIN profiles pr ON pr.id = hba.user_id
  WHERE hba.user_id = p_user_id
    AND hba.is_active = true
    AND hba.paystack_subaccount_code IS NOT NULL
    -- Must be approved/verified by admin
    AND (
      pr.host_verification_status = 'approved' 
      OR pr.host_verified_at IS NOT NULL
    )
  ORDER BY hba.created_at DESC
  LIMIT 1;

  RETURN v_subaccount_code;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_host_subaccount_for_party(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_host_subaccount_for_user(UUID) TO anon, authenticated, service_role;
