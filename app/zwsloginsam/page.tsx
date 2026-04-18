import { Metadata } from "next"
import Link from "next/link"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { Container } from "@/components/layout/container"
import { DotGridBackground } from "@/components/effects/dot-grid-background"

export const metadata: Metadata = {
  title: "Admin Login | ZWS Cloud",
  description: "Secure admin access to ZWS Cloud management system",
  robots: "noindex, nofollow",
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Interactive dot grid background */}
      <DotGridBackground />
      
      {/* Ambient accent glow - top */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
      
      {/* Ambient accent glow - bottom */}
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Container className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="mb-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight transition-colors hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-accent"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
              <span>ZWS Cloud</span>
            </Link>
          </div>

          {/* Login card */}
          <div className="glass glass-strong relative rounded-2xl p-8">
            {/* Subtle accent border glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 via-transparent to-accent/5 opacity-60" />
            
            <div className="relative">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7 text-accent"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Admin Access</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Secure login for ZWS Cloud administrators
                </p>
              </div>
              
              <AdminLoginForm />
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-xs text-muted-foreground">
              This area is restricted. Unauthorized access attempts are logged.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to main site
            </Link>
          </div>
        </Container>
      </div>
    </main>
  )
}
