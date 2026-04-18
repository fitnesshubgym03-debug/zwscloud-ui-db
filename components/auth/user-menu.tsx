"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Shield,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

interface SessionUser {
  id: string
  email: string
  name: string | null
  role: "user" | "admin" | "super_admin"
  isAdmin: boolean
}

interface SessionResponse {
  authenticated: boolean
  user?: SessionUser
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function UserMenu() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  
  const { data: session, error, isLoading } = useSWR<SessionResponse>(
    "/api/auth/session",
    fetcher,
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setLoggingOut(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Spinner className="h-4 w-4" />
      </Button>
    )
  }

  // Not authenticated - show login/register buttons
  if (error || !session?.authenticated) {
    return (
      <>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild className="gap-1.5">
          <Link href="/register">
            Get started
          </Link>
        </Button>
      </>
    )
  }

  const user = session.user!
  const displayName = user.name || user.email.split("@")[0]
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
            {initials}
          </div>
          <span className="hidden sm:inline">{displayName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/client-area" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/client-area/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        {user.isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={loggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {loggingOut ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
