#!/usr/bin/env node

/**
 * Admin User Seeding Script
 * This script creates the admin user in Supabase with the credentials from environment variables
 * Run with: pnpm seed:admin
 */

import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || "Admin"

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function seedAdmin() {
  try {
    console.log(`[Admin Seed] Starting admin user setup for ${adminEmail}...`)

    // Run migration first - add columns if they don't exist
    console.log("[Admin Seed] Running database migration...")
    await supabase.rpc("exec", {
      sql: `
        ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
        ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;
        CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON public.admin_profiles(email);
      `,
    }).catch(() => {
      // Migration might fail if columns already exist, that's OK
      console.log("[Admin Seed] Database columns already exist or migration skipped")
    })

    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("email", adminEmail.toLowerCase())
      .single()

    if (existingAdmin) {
      console.log(`[Admin Seed] Admin user ${adminEmail} already exists`)
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      const { error: updateError } = await supabase
        .from("admin_profiles")
        .update({
          hashed_password: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("email", adminEmail.toLowerCase())

      if (updateError) {
        console.error("[Admin Seed] Error updating admin password:", updateError)
        process.exit(1)
      }
      
      console.log("[Admin Seed] Admin password updated")
      return
    }

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[Admin Seed] Error checking admin user:", checkError)
      process.exit(1)
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Create admin profile
    const { data: newAdmin, error: insertError } = await supabase
      .from("admin_profiles")
      .insert({
        email: adminEmail.toLowerCase(),
        username: adminEmail.split("@")[0],
        display_name: adminDisplayName,
        hashed_password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("[Admin Seed] Error creating admin user:", insertError)
      process.exit(1)
    }

    console.log(`[Admin Seed] Admin user ${adminEmail} created successfully`)
    console.log("[Admin Seed] You can now login at /zwsloginsam with these credentials:")
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
  } catch (error) {
    console.error("[Admin Seed] Unexpected error:", error)
    process.exit(1)
  }
}

seedAdmin()
