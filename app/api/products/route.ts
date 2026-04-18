import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { BillingTerm, getProductPrice, monthlyToHourly } from "@/lib/pricing"

interface ProductRow {
  id: string
  slug: string
  name: string
  description: string | null
  cpu_cores: number
  ram_gb: number
  storage_gb: number
  storage_type: string
  bandwidth_tb: string
  price_1m: string
  price_3m: string | null
  price_6m: string | null
  price_12m: string | null
  price_24m: string | null
  price_hourly: string | null
  features: string[] | null
  is_featured: boolean
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const term = parseInt(searchParams.get("term") || "1") as BillingTerm
    const category = searchParams.get("category") || "vps"

    const products = await sql`
      SELECT * FROM products 
      WHERE category = ${category} AND is_active = true 
      ORDER BY sort_order ASC
    ` as ProductRow[]

    // Transform products with pricing for requested term
    const transformedProducts = products.map((product) => {
      const productForPricing = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        cpuCores: product.cpu_cores,
        ramGb: product.ram_gb,
        storageGb: product.storage_gb,
        storageType: product.storage_type,
        bandwidthTb: parseFloat(product.bandwidth_tb),
        price1m: parseFloat(product.price_1m),
        price3m: product.price_3m ? parseFloat(product.price_3m) : null,
        price6m: product.price_6m ? parseFloat(product.price_6m) : null,
        price12m: product.price_12m ? parseFloat(product.price_12m) : null,
        price24m: product.price_24m ? parseFloat(product.price_24m) : null,
        priceHourly: product.price_hourly ? parseFloat(product.price_hourly) : null,
        features: product.features || [],
      }

      const monthlyPrice = getProductPrice(productForPricing, term)

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        cpuCores: product.cpu_cores,
        ramGb: product.ram_gb,
        storageGb: product.storage_gb,
        storageType: product.storage_type,
        bandwidthTb: parseFloat(product.bandwidth_tb),
        pricing: {
          monthly: parseFloat(product.price_1m),
          termPrice: monthlyPrice,
          hourly: monthlyToHourly(monthlyPrice),
          term,
          termTotal: monthlyPrice * term,
        },
        features: product.features || [],
        isFeatured: product.is_featured,
      }
    })

    return NextResponse.json({
      products: transformedProducts,
      term,
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
