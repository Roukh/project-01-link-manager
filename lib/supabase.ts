import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eshmrgmtwghuhmlrbmmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaG1yZ210d2dodWhtbHJibW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDExMDEsImV4cCI6MjA3OTA3NzEwMX0.ABag9OiQsvz898t6AK6EuJ2M7hmvaJn67lBvV8XVADo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
