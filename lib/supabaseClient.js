// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
// Funciones helper para operaciones comunes
export async function assignWristband(nfcUid, name) {
    // Crear registro de pulsera
    const { data: wristband, error: wristbandError } = await supabase
      .from('wristbands')
      .insert({
        nfc_uid: nfcUid,
        owner_name: name,
        balance: 0
      })
      .select()
      .single()
  
    if (wristbandError) throw wristbandError
    return wristband
  }
  
  export async function getWristband(id) {
    const { data, error } = await supabase
      .from('wristbands')
      .select('*')
      .eq('id', id)
      .single()
  
    if (error) throw error
    return data
  }
  
  export async function addMoney(wristbandId, amount) {
    const { error } = await supabase
      .from('transactions')
      .insert({
        wristband_id: wristbandId,
        type: 'DEPOSIT',
        amount: amount
      })
  
    if (error) throw error
  
    // El trigger de Supabase actualizará automáticamente el balance
  }
  
  export async function spendMoney(wristbandId, amount, description) {
    // Primero verificamos el saldo
    const { data: wristband } = await getWristband(wristbandId)
    
    if (wristband.balance < amount) {
      throw new Error('Saldo insuficiente')
    }
  
    const { error } = await supabase
      .from('transactions')
      .insert({
        wristband_id: wristbandId,
        type: 'PURCHASE',
        amount: amount,
        description: description
      })
  
    if (error) throw error
  }
  
  export async function getTransactions(wristbandId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wristband_id', wristbandId)
      .order('created_at', { ascending: false })
  
    if (error) throw error
    return data
  }
  
 