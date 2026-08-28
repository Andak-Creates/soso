
    DROP POLICY IF EXISTS "Hosts can insert tickets for their parties" ON tickets;
    CREATE POLICY "Hosts can insert tickets for their parties"
    ON tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM parties
        WHERE parties.id = party_id
        AND parties.host_id = auth.uid()
      )
    );
  