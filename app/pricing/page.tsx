"use client"

import { useState } from "react"
import { SiteShell } from "@/components/layout/site-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Container } from "@/components/layout/container"
import { PlanCard } from "@/components/plans/plan-card"
import { SectionHeader } from "@/components/layout/section-header"
import { CTASection } from "@/components/cta-section"
import { plans, getPlansByTier, getPlanPrice } from "@/data/plans"
import { Check, X } from "lucide-react"
import { FAQAccordion } from "@/components/faq-accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { type BillingTerm, getTermLabel, getTermDiscountRate, formatPrice } from "@/lib/pricing"

const billingTerms: BillingTerm[] = [1, 3, 6, 12, 24]

const pricingFaqs = [
  {
    q: "What currency is pricing shown in?",
    a: "Prices are displayed in INR. USD equivalents are available upon request and during checkout.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. You can change plans at any time. We pro-rate the difference and apply it as a credit to your account.",
  },
  {
    q: "Are there setup fees?",
    a: "No. All plans ship with zero setup fees. You pay only for the plan you choose and any optional add-ons.",
  },
  {
    q: "Do you offer term discounts?",
    a: "Yes! Save up to 25% with longer billing terms: 3-month (10% off), 6-month (15% off), 12-month (20% off), and 24-month (25% off).",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a 7-day money-back guarantee on all plans. If you're not satisfied, contact support within 7 days for a full refund.",
  },
]

export default function PricingPage() {
  const [term, setTerm] = useState<BillingTerm>(1)

  const starterPlans = getPlansByTier("starter")
  const proPlans = getPlansByTier("pro")
  const enterprisePlans = getPlansByTier("enterprise")

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Pricing"
        title="Plans built around real workloads."
        description="No surprise bills, no manufactured urgency. Upgrade, downgrade, or cancel at any time."
      />

      {/* Term Selector */}
      <section className="py-8">
        <Container>
          <div className="glass glass-strong mx-auto inline-flex max-w-fit items-center gap-4 rounded-xl p-2">
            <span className="pl-2 text-sm font-medium text-muted-foreground">Billing:</span>
            <RadioGroup
              value={term.toString()}
              onValueChange={(v) => setTerm(Number(v) as BillingTerm)}
              className="flex gap-1"
            >
              {billingTerms.map((t) => {
                const discount = getTermDiscountRate(t)
                return (
                  <Label
                    key={t}
                    htmlFor={`pricing-term-${t}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground"
                  >
                    <RadioGroupItem id={`pricing-term-${t}`} value={t.toString()} className="sr-only" />
                    <span>{getTermLabel(t)}</span>
                    {discount > 0 && (
                      <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent has-[[data-state=checked]]:bg-accent-foreground/20 has-[[data-state=checked]]:text-accent-foreground">
                        -{Math.round(discount * 100)}%
                      </span>
                    )}
                  </Label>
                )
              })}
            </RadioGroup>
          </div>
        </Container>
      </section>

      {/* Starter Plans */}
      <section className="py-8">
        <Container className="flex flex-col gap-8">
          <SectionHeader
            eyebrow="Starter Tier"
            title="Perfect for getting started"
            description="Ideal for personal projects, development, and small applications."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {starterPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} term={term} />
            ))}
          </div>
        </Container>
      </section>

      {/* Pro Plans */}
      <section className="py-8">
        <Container className="flex flex-col gap-8">
          <SectionHeader
            eyebrow="Pro Tier"
            title="For growing applications"
            description="Higher performance and resources for production workloads."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {proPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} term={term} />
            ))}
          </div>
        </Container>
      </section>

      {/* Enterprise Plans */}
      <section className="py-8">
        <Container className="flex flex-col gap-8">
          <SectionHeader
            eyebrow="Enterprise Tier"
            title="Maximum performance"
            description="Enterprise-grade resources with priority support and SLA."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enterprisePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} term={term} />
            ))}
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            eyebrow="Compare plans"
            title="Feature-by-feature comparison"
          />
          <div className="glass overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-left font-medium">Plan</th>
                  <th className="px-5 py-4 text-left font-medium">vCPU</th>
                  <th className="px-5 py-4 text-left font-medium">RAM</th>
                  <th className="px-5 py-4 text-left font-medium">Storage</th>
                  <th className="px-5 py-4 text-left font-medium">Bandwidth</th>
                  <th className="px-5 py-4 text-left font-medium">Support</th>
                  <th className="px-5 py-4 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr key={plan.id} className={i % 2 === 0 ? "" : "bg-foreground/[0.02]"}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{plan.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{plan.tier}</div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{plan.vcpu} cores</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{plan.ramGB} GB</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{plan.storageGB} GB NVMe</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{plan.bandwidthTB} TB</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {plan.tier === "enterprise" ? "24/7 Priority" : plan.tier === "pro" ? "Priority" : "Standard"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                      {formatPrice(getPlanPrice(plan, term))}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader
            eyebrow="Pricing FAQ"
            title="Common questions about billing"
          />
          <FAQAccordion items={pricingFaqs} />
        </Container>
      </section>

      <CTASection />
    </SiteShell>
  )
}
