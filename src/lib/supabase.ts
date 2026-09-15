import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvsbyyzaothruswazfer.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2c2J5eXphb3RocnVzd2F6ZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTI5MzMsImV4cCI6MjEwNDk4ODkzM30.BpffudEGwrjhuo6sIUYW0iSazHRpuiGpuboc6CHrQSg';

export const supabase = createClient(supabaseUrl, supabaseKey);
