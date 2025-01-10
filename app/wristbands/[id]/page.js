// app/wristbands/[id]/page.js
import { WristbandClient } from './wristband-client'
import { supabase } from '@/lib/supabaseClient'

// Servidor
async function getInitialData(id) {
  const { data: wristband } = await supabase
    .from('wristbands')
    .select('*')
    .eq('id', id)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      wristbands (
        owner_name,
        nfc_uid
      )
    `)
    .eq('wristband_id', id)
    .order('created_at', { ascending: false })

  return {
    wristband,
    transactions
  }
}

export default async function WristbandPage({ params }) {
  const initialData = await getInitialData(params.id)

  return <WristbandClient initialData={initialData} id={params.id} />
}