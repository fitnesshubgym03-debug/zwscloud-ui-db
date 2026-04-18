"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Gauge,
  Globe,
  HardDrive,
  MemoryStick,
  MonitorCog,
  Network,
  Clock,
  Zap,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  calculateCustomConfigPrice,
  formatPrice,
  formatHourlyPrice,
  getTermLabel,
  getTermDiscountRate,
  type BillingTerm,
} from "@/lib/pricing"
import {
  CONFIGURATOR_LIMITS,
  OPERATING_SYSTEMS,
  REGIONS,
  BANDWIDTH_OPTIONS,
  BILLING_TERMS,
  type DiskConfig,
  getTotalStorageGb,
  getDiskLabels,
} from "@/lib/product-config"

export function Configurator() {
  const [cpu, setCpu] = useState<number[]>([CONFIGURATOR_LIMITS.cpu.default])
  const [ram, setRam] = useState<number[]>([CONFIGURATOR_LIMITS.ram.default])
  const [disks, setDisks] = useState<DiskConfig[]>([
    { type: "nvme", sizeGb: 160, label: "Disk 1" },
  ])
  const [bandwidth, setBandwidth] = useState<number>(CONFIGURATOR_LIMITS.bandwidth.default)
  const [os, setOs] = useState(OPERATING_SYSTEMS[0].name)
  const [region, setRegion] = useState(REGIONS[0].name)
  const [term, setTerm] = useState<BillingTerm>(1)
  const [submitting, setSubmitting] = useState(false)

  // Disk management
  function addDisk() {
    if (disks.length < CONFIGURATOR_LIMITS.disks.max) {
      const newDiskNumber = disks.length + 1
      setDisks([
        ...disks,
        {
          type: "nvme",
          sizeGb: 160,
          label: `Disk ${newDiskNumber}`,
        },
      ])
    }
  }

  function removeDisk(index: number) {
    if (disks.length > CONFIGURATOR_LIMITS.disks.min) {
      setDisks(disks.filter((_, i) => i !== index))
    }
  }

  function updateDisk(index: number, updates: Partial<DiskConfig>) {
    const newDisks = [...disks]
    newDisks[index] = { ...newDisks[index], ...updates }
    setDisks(newDisks)
  }

  const pricing = useMemo(() => {
    const osCharge = OPERATING_SYSTEMS.find((o) => o.name === os)?.priceAddon ?? 0
    const totalStorageGb = getTotalStorageGb(disks)
    const primaryStorageType = disks[0]?.type || "nvme"

    const basePricing = calculateCustomConfigPrice(
      {
        cpuCores: cpu[0],
        ramGb: ram[0],
        storageGb: totalStorageGb,
        storageType: primaryStorageType,
        bandwidthTb: bandwidth,
      },
      undefined,
      term,
      "monthly"
    )

    // Add OS charge to monthly price
    const monthlyWithOs = basePricing.discountedMonthly + osCharge
    const hourlyWithOs = monthlyWithOs / 730

    return {
      ...basePricing,
      monthlyWithOs,
      hourlyWithOs,
      termTotalWithOs: monthlyWithOs * term,
      osCharge,
    }
  }, [cpu, ram, disks, bandwidth, os, term])

  async function handleOrder() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom_config",
          config: {
            cpu: cpu[0],
            ram: ram[0],
            disks,
            bandwidth,
            os,
            region,
            term,
          },
          amount: pricing.termTotalWithOs,
          monthlyAmount: pricing.monthlyWithOs,
        }),
      })
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      
      if (data.payment_session_id) {
        // Redirect to Cashfree checkout
        window.location.href = data.payment_link
      } else {
        toast.success("Order request received", {
          description: "Our team will reach out with next steps shortly.",
        })
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-6">
        {/* Compute Section */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Compute
          </h2>
          <div className="mt-6 flex flex-col gap-8">
            <SliderRow
              icon={Cpu}
              label="vCPU"
              unit="cores"
              value={cpu[0]}
              min={CONFIGURATOR_LIMITS.cpu.min}
              max={CONFIGURATOR_LIMITS.cpu.max}
              step={CONFIGURATOR_LIMITS.cpu.step}
              onChange={setCpu}
            />
            <SliderRow
              icon={MemoryStick}
              label="Memory"
              unit="GB"
              value={ram[0]}
              min={CONFIGURATOR_LIMITS.ram.min}
              max={CONFIGURATOR_LIMITS.ram.max}
              step={CONFIGURATOR_LIMITS.ram.step}
              onChange={setRam}
            />
            
            {/* Multi-Disk Storage Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HardDrive className="h-4 w-4 text-accent" />
                  Storage Disks
                </div>
                <span className="text-xs text-muted-foreground">
                  {disks.length} / {CONFIGURATOR_LIMITS.disks.max} disks
                </span>
              </div>
              
              {/* Disk Cards */}
              <div className="space-y-3">
                {disks.map((disk, index) => {
                  const limits = disk.type === "nvme" 
                    ? CONFIGURATOR_LIMITS.storage.nvme 
                    : CONFIGURATOR_LIMITS.storage.ssd
                  
                  return (
                    <div key={index} className="glass rounded-lg p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">{disk.label}</span>
                        {disks.length > CONFIGURATOR_LIMITS.disks.min && (
                          <button
                            onClick={() => removeDisk(index)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`Remove ${disk.label}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {/* Storage Type Selection */}
                        <RadioGroup
                          value={disk.type}
                          onValueChange={(v) => updateDisk(index, { type: v as "nvme" | "ssd" })}
                          className="grid grid-cols-2 gap-2"
                        >
                          <Label className="glass flex cursor-pointer flex-col items-center justify-center rounded-md px-3 py-2 text-xs transition-colors hover:text-foreground has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:text-foreground">
                            <RadioGroupItem value="nvme" className="sr-only" />
                            <Zap className="mb-1 h-3 w-3 text-accent" />
                            <span className="font-medium">NVMe</span>
                          </Label>
                          <Label className="glass flex cursor-pointer flex-col items-center justify-center rounded-md px-3 py-2 text-xs transition-colors hover:text-foreground has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:text-foreground">
                            <RadioGroupItem value="ssd" className="sr-only" />
                            <HardDrive className="mb-1 h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">SSD</span>
                          </Label>
                        </RadioGroup>
                        
                        {/* Size Slider */}
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Size</span>
                            <span className="font-mono text-sm text-foreground">{disk.sizeGb} GB</span>
                          </div>
                          <Slider
                            value={[disk.sizeGb]}
                            min={limits.min}
                            max={limits.max}
                            step={limits.step}
                            onValueChange={(v) => updateDisk(index, { sizeGb: v[0] })}
                            aria-label={`${disk.label} size`}
                          />
                          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                            <span>{limits.min} GB</span>
                            <span>{limits.max} GB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Add Disk Button */}
              {disks.length < CONFIGURATOR_LIMITS.disks.max && (
                <Button
                  onClick={addDisk}
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Disk
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Network & Image Section */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Network & Image
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SelectField
              icon={Network}
              label="Bandwidth"
              value={bandwidth.toString()}
              onChange={(v) => setBandwidth(Number(v))}
              options={BANDWIDTH_OPTIONS.map((b) => ({
                label: b.label,
                value: b.value.toString(),
              }))}
            />
            <SelectField
              icon={Globe}
              label="Region"
              value={region}
              onChange={setRegion}
              options={REGIONS.map((r) => ({ label: r.name, value: r.name }))}
            />
            <SelectField
              icon={MonitorCog}
              label="Operating System"
              value={os}
              onChange={setOs}
              options={OPERATING_SYSTEMS.map((o) => ({ label: o.name, value: o.name }))}
              wide
            />
          </div>

          {/* Bandwidth Info */}
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            <span>
              {bandwidth <= CONFIGURATOR_LIMITS.bandwidth.included
                ? `All ${bandwidth} TB bandwidth included`
                : `${CONFIGURATOR_LIMITS.bandwidth.included} TB included + ${(bandwidth - CONFIGURATOR_LIMITS.bandwidth.included).toFixed(1)} TB extra (₹${((bandwidth - CONFIGURATOR_LIMITS.bandwidth.included) * 100).toFixed(0)}/mo)`}
            </span>
          </div>

          {/* Billing Term Selection */}
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-accent" />
              Billing Term
            </div>
            <RadioGroup
              value={term.toString()}
              onValueChange={(v) => setTerm(Number(v) as BillingTerm)}
              className="grid grid-cols-5 gap-2"
            >
              {BILLING_TERMS.map((t) => {
                const discount = getTermDiscountRate(t.value)
                return (
                  <Label
                    key={t.value}
                    htmlFor={`term-${t.value}`}
                    className="glass flex cursor-pointer flex-col items-center justify-center rounded-lg px-2 py-2.5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:text-foreground"
                  >
                    <RadioGroupItem id={`term-${t.value}`} value={t.value.toString()} className="sr-only" />
                    <span className="text-xs font-medium">{getTermLabel(t.value)}</span>
                    {discount > 0 && (
                      <span className="mt-0.5 text-[10px] font-medium text-accent">
                        -{Math.round(discount * 100)}%
                      </span>
                    )}
                  </Label>
                )
              })}
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Summary Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="glass glass-strong flex flex-col rounded-2xl p-6 sm:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your Build
          </h3>
          
          {/* Main Price Display */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">
              {formatPrice(pricing.termTotalWithOs)}
            </span>
            <span className="text-sm text-muted-foreground">
              /{term === 1 ? "mo" : `${term}mo`}
            </span>
          </div>
          
          {/* Effective Monthly & Hourly */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatPrice(pricing.monthlyWithOs)}/mo effective
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatHourlyPrice(pricing.hourlyWithOs)}
            </span>
          </div>

          {/* Savings Badge */}
          {pricing.savingsPercentage > 0 && (
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              <CheckCircle2 className="h-3 w-3" />
              Save {pricing.savingsPercentage}% with {getTermLabel(term)} billing
            </div>
          )}

          {/* Configuration Summary */}
          <dl className="mt-6 flex flex-col gap-3 border-t border-border pt-5 text-sm">
            <SummaryRow k="vCPU" v={`${cpu[0]} cores`} />
            <SummaryRow k="Memory" v={`${ram[0]} GB DDR4`} />
            <SummaryRow k="Storage" v={getDiskLabels(disks)} />
            <SummaryRow k="Total Storage" v={`${getTotalStorageGb(disks)} GB`} />
            <SummaryRow
              k="Bandwidth"
              v={BANDWIDTH_OPTIONS.find((b) => b.value === bandwidth)?.label ?? `${bandwidth} TB`}
            />
            <SummaryRow k="OS" v={os} />
            <SummaryRow k="Region" v={region} />
            <SummaryRow k="Term" v={getTermLabel(term)} />
          </dl>

          {/* Price Breakdown */}
          <div className="mt-4 rounded-lg bg-foreground/[0.03] p-3 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>CPU ({cpu[0]} cores)</span>
              <span>{formatPrice(pricing.breakdown.cpu)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
              <span>RAM ({ram[0]} GB)</span>
              <span>{formatPrice(pricing.breakdown.ram)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
              <span>Storage ({storage[0]} GB)</span>
              <span>{formatPrice(pricing.breakdown.storage)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
              <span>Bandwidth ({bandwidth} TB)</span>
              <span>{formatPrice(pricing.breakdown.bandwidth)}</span>
            </div>
            {pricing.osCharge > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
                <span>Windows License</span>
                <span>{formatPrice(pricing.osCharge)}</span>
              </div>
            )}
            {pricing.savingsPercentage > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-accent">
                <span>Term Discount ({pricing.savingsPercentage}%)</span>
                <span>-{formatPrice(pricing.baseMonthly - pricing.discountedMonthly)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium text-foreground">
              <span>Monthly Total</span>
              <span>{formatPrice(pricing.monthlyWithOs)}</span>
            </div>
          </div>

          {/* Deploy Info */}
          <div className="mt-4 flex items-center gap-2 rounded-md border border-accent/20 bg-accent/5 p-3 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
            <span>
              Deploy-ready in under 60 seconds. Cancel anytime within the Refund Policy window.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={handleOrder} disabled={submitting} className="w-full gap-1.5">
              {submitting ? (
                <>
                  <Spinner className="size-4" />
                  Processing
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/contact">Request a Tailored Quote</a>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" />
          Quote updates live as you adjust your build.
        </div>
      </aside>
    </div>
  )
}

function SliderRow({
  icon: Icon,
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  icon: typeof Cpu
  label: string
  unit: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number[]) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-accent" />
          {label}
        </div>
        <div className="font-mono text-sm text-foreground">
          {value} {unit}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} {unit.split(" ")[0]}</span>
        <span>{max} {unit.split(" ")[0]}</span>
      </div>
    </div>
  )
}

function SelectField({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  wide,
}: {
  icon: typeof Cpu
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  wide?: boolean
}) {
  return (
    <div className={`flex flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium text-foreground">{v}</dd>
    </div>
  )
}
