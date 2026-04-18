"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Menu, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type AdminUser = {
  email: string
  displayName: string
  role: string
}

export function AdminHeader({ user }: { user: AdminUser }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" })
      router.push("/zwsloginsam")
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-semibold">ZWS Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View Site
          </Link>
          
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
