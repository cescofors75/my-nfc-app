// app/wristbands/[id]/page.js
import { Suspense } from 'react'
import { WristbandClient } from './wristband-client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabaseClient'

async function getInitialData(wristbandId) {
  try {
    const [wristbandResponse, transactionsResponse] = await Promise.all([
      supabase
        .from('wristbands')
        .select('*')
        .eq('id', wristbandId)
        .single(),
      
      supabase
        .from('transactions')
        .select(`
          *,
          wristbands (
            owner_name,
            nfc_uid
          )
        `)
        .eq('wristband_id', wristbandId)
        .order('created_at', { ascending: false })
    ])

    if (wristbandResponse.error) throw wristbandResponse.error
    if (transactionsResponse.error) throw transactionsResponse.error

    return {
      wristband: wristbandResponse.data,
      transactions: transactionsResponse.data
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

// Componente asíncrono para cargar los datos
async function WristbandData({ wristbandId }) {
  const initialData = await getInitialData(wristbandId)
  return <WristbandClient initialData={initialData} id={wristbandId} />
}

// Página principal que espera los params
export default async function WristbandPage({ params }) {
  // Esperar y obtener el ID de manera asíncrona
  const { id } = await params
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WristbandData wristbandId={id} />
    </Suspense>
  )
}