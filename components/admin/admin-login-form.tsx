"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success" }

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [state, setState] = useState<FormState>({ status: "idle" })

  const emailError =
    touched.email && email.length === 0
      ? "Email is required."
      : touched.email && !email.includes("@")
      ? "Please enter a valid email."
      : undefined

  const passwordError =
    touched.password && password.length === 0
      ? "Password is required."
      : undefined

  const disabled =
    state.status === "submitting" ||
    !email ||
    !password ||
    !!emailError ||
    !!passwordError

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (email.length === 0 || password.length === 0) return

    setState({ status: "submitting" })

    try {
      // Use unified auth endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setState({
          status: "error",
          message: data.error || "Invalid credentials. Please try again.",
        })
        return
      }

      // Check if user has admin privileges
      const isAdmin = data.user?.role === "admin" || data.user?.role === "super_admin"
      
      if (!isAdmin) {
        setState({
          status: "error",
          message: "Access denied. Admin privileges required.",
        })
        return
      }

      setState({ status: "success" })
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push("/admin")
        router.refresh()
      }, 800)
    } catch {
      setState({
        status: "error",
        message: "Connection error. Please try again.",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {state.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
      {state.status === "success" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Authentication successful. Redirecting to dashboard...</span>
        </div>
      )}

      <FieldGroup>
        <Field data-invalid={!!emailError || undefined}>
          <FieldLabel htmlFor="admin-email">Email Address</FieldLabel>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            placeholder="sam@zws.cloud"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!emailError}
            className="h-11 bg-background/50 transition-colors focus:bg-background"
            required
          />
          {emailError && <FieldError>{emailError}</FieldError>}
        </Field>

        <Field data-invalid={!!passwordError || undefined}>
          <FieldLabel htmlFor="admin-password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordError}
              className="h-11 bg-background/50 pr-11 transition-colors focus:bg-background"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError && <FieldError>{passwordError}</FieldError>}
        </Field>
      </FieldGroup>

      <Button 
        type="submit" 
        size="lg"
        className="h-11 w-full gap-2 font-medium" 
        disabled={disabled}
      >
        {state.status === "submitting" ? (
          <>
            <Spinner className="size-4" />
            Authenticating...
          </>
        ) : state.status === "success" ? (
          <>
            <Shield className="h-4 w-4" />
            Authenticated
          </>
        ) : (
          <>
            Sign in to Dashboard
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Protected by ZWS Cloud Security
      </p>
    </form>
  )
}
