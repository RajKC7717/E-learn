import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kckooddqjmoewxwrgwtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja29vZGRxam1vZXd4d3Jnd3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Nzk4NDksImV4cCI6MjA4MTM1NTg0OX0.59xh_qS19B8jIYe65_k2DAr_HcLPia26V-pIKUBuZDI';

export const supabase = createClient(supabaseUrl, supabaseKey);