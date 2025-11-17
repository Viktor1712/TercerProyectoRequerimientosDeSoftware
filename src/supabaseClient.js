// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY son requeridos')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
