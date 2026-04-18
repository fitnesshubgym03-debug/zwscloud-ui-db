import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession, isAdmin } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata: Metadata = {
  title: "Admin Dashboard | ZWS Cloud",
  description: "ZWS Cloud Admin Management System",
  robots: "noindex, nofollow",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login?redirect=/admin")
  }

  // Redirect to client area if not admin
  if (!isAdmin(session)) {
    redirect("/client-area")
  }

  const user = {
    email: session.email,
    displayName: session.name || session.email.split("@")[0],
    role: session.role,
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
