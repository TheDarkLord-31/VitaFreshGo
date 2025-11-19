import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://nzohxudmjqxrvkhgmnpt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56b2h4dWRtanF4cnZraGdtbnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMTg0NjgsImV4cCI6MjA3NDg5NDQ2OH0.AbVI4qpmglCLJr-mNqxSzOg5jkcDxmh0nrlqUKEicsc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
