import { NextRequest, NextResponse } from "next/server"
import { 
  BillingTerm, 
  StorageType,
  calculateCustomConfigPrice, 
  validateCustomConfig,
  DEFAULT_CUSTOM_CONFIG_LIMITS,
  DEFAULT_CUSTOM_CONFIG_PRICING,
  calculateTax,
  formatPrice,
} from "@/lib/pricing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cpuCores,
      ramGb,
      storageGb,
      storageType = "nvme",
      bandwidthTb = 1,
      term = 1,
    } = body

    // Validate input types
    if (
      typeof cpuCores !== "number" ||
      typeof ramGb !== "number" ||
      typeof storageGb !== "number" ||
      typeof bandwidthTb !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input: all numeric values must be numbers" },
        { status: 400 }
      )
    }

    const config = {
      cpuCores,
      ramGb,
      storageGb,
      storageType: storageType as StorageType,
      bandwidthTb,
    }

    // Validate configuration
    const validation = validateCustomConfig(config, DEFAULT_CUSTOM_CONFIG_LIMITS)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid configuration", details: validation.errors },
        { status: 400 }
      )
    }

    // Calculate pricing
    const pricing = calculateCustomConfigPrice(
      config,
      DEFAULT_CUSTOM_CONFIG_PRICING,
      term as BillingTerm
    )

    // Calculate tax
    const taxAmount = calculateTax(pricing.termTotal)
    const totalWithTax = pricing.termTotal + taxAmount

    return NextResponse.json({
      config: {
        cpuCores,
        ramGb,
        storageGb,
        storageType,
        bandwidthTb,
        term,
      },
      pricing: {
        baseMonthly: pricing.baseMonthly,
        discountedMonthly: pricing.discountedMonthly,
        hourly: pricing.hourly,
        termTotal: pricing.termTotal,
        savingsPercentage: pricing.savingsPercentage,
        breakdown: pricing.breakdown,
      },
      tax: {
        rate: 18,
        amount: taxAmount,
      },
      total: {
        subtotal: pricing.termTotal,
        tax: taxAmount,
        grandTotal: totalWithTax,
        formatted: {
          subtotal: formatPrice(pricing.termTotal),
          tax: formatPrice(taxAmount),
          grandTotal: formatPrice(totalWithTax),
        },
      },
      limits: DEFAULT_CUSTOM_CONFIG_LIMITS,
    })
  } catch (error) {
    console.error("Pricing calculation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
