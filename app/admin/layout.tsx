import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify } from "jose"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export const metadata: Metadata = {
  title: "Admin Dashboard | ZWS Cloud",
  description: "ZWS Cloud Admin Management System",
  robots: "noindex, nofollow",
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zws-cloud-admin-secret-key-change-in-production"
)

async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      email: payload.email as string,
      displayName: payload.displayName as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()

  if (!user) {
    redirect("/zwsloginsam")
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
