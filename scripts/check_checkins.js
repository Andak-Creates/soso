const fs = require('fs');

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.substring(0, idx).trim(), line.substring(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTicketCheckIns() {
  const headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/ticket_check_ins?select=*,checked_in_by:profiles!ticket_check_ins_checked_in_by_fkey(id,username,full_name),tickets!inner(id,party_id,reference,guest_name,guest_email,quantity_purchased,quantity_used)&limit=10`, { headers });
  const checkIns = await res.json();
  console.log('Ticket check-ins query result:', checkIns);
}

checkTicketCheckIns();
