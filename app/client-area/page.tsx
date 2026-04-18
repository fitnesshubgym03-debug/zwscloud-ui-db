import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession, isAdmin } from "@/lib/auth"
import { SiteShell } from "@/components/layout/site-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { 
  Server, 
  CreditCard, 
  Settings, 
  Shield,
  ArrowRight,
  Plus
} from "lucide-react"

export const metadata: Metadata = {
  title: "Client Area | ZWS Cloud",
  description: "Manage your servers, billing, and account.",
}

export default async function ClientAreaPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login?redirect=/client-area")
  }

  const displayName = session.name || session.email.split("@")[0]
  const userIsAdmin = isAdmin(session)

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Client area"
        title={`Welcome back, ${displayName}`}
        description="Manage your cloud infrastructure, billing, and account settings."
      />
      <Container className="py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Servers Card */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Server className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">My Servers</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              View and manage your VPS instances, configure settings, and monitor performance.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/client-area/servers">
                  View Servers
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/pricing">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Server
                </Link>
              </Button>
            </div>
          </div>

          {/* Billing Card */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <CreditCard className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Billing & Invoices</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              View your invoices, manage payment methods, and track your spending.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/client-area/billing">
                View Billing
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Settings Card */}
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Settings className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Account Settings</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Update your profile, change password, and manage security settings.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/client-area/settings">
                Settings
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Admin Panel Card - Only shown to admins */}
          {userIsAdmin && (
            <div className="glass rounded-2xl border-2 border-accent/30 p-6 md:col-span-2 lg:col-span-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Admin Panel</h3>
                    <p className="text-sm text-muted-foreground">
                      You have admin access. Manage products, orders, customers, and system settings.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/admin">
                    Open Admin Panel
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{session.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {session.role === "super_admin" ? "Super Admin" : 
                 session.role === "admin" ? "Admin" : "User"}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </SiteShell>
  )
}
