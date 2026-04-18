"use client"

import Link from "next/link"
import { Check, ArrowRight, Clock } from "lucide-react"
import type { Plan } from "@/data/plans"
import { getPlanPrice, getPlanSavings } from "@/data/plans"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrice, formatHourlyPrice, getTermLabel, type BillingTerm } from "@/lib/pricing"

interface PlanCardProps {
  plan: Plan
  term?: BillingTerm
  ctaHref?: string
  showHourly?: boolean
}

export function PlanCard({
  plan,
  term = 1,
  ctaHref,
  showHourly = true,
}: PlanCardProps) {
  const monthlyPrice = getPlanPrice(plan, term)
  const savings = getPlanSavings(plan, term)

  return (
    <div
      className={cn(
        "glass glass-hover relative flex flex-col rounded-2xl p-6",
        plan.popular && "accent-glow ring-1 ring-accent/30"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground shadow-lg shadow-accent/30">
          Most popular
        </div>
      )}

      {/* Header */}
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
        {plan.tier === "enterprise" && (
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
            Enterprise
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      {/* Price */}
      <div className="mt-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight">
            {formatPrice(monthlyPrice)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        
        {/* Savings & Hourly */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {showHourly && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatHourlyPrice(plan.priceHourly)}
            </span>
          )}
          {savings > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
              Save {savings}% with {getTermLabel(term)}
            </span>
          )}
        </div>
      </div>

      {/* Specs */}
      <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-foreground/[0.03] p-4 text-sm">
        <Spec label="vCPU" value={`${plan.vcpu} cores`} />
        <Spec label="RAM" value={`${plan.ramGB} GB`} />
        <Spec label="Storage" value={`${plan.storageGB} GB NVMe`} />
        <Spec label="Bandwidth" value={`${plan.bandwidthTB} TB`} />
      </dl>

      {/* Features */}
      <ul className="mt-5 flex flex-col gap-2.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8 flex flex-col gap-2">
        <Button
          asChild
          variant={plan.popular ? "default" : "outline"}
          className="w-full gap-1.5"
        >
          <Link href={ctaHref ?? `/configure?plan=${plan.id}&term=${term}`}>
            Deploy {plan.name.replace(" VPS", "").replace("Enterprise ", "").replace("Pro ", "").replace("Starter ", "")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  )
}
