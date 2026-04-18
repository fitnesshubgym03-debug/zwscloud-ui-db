import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { BillingTerm, getProductPrice, monthlyToHourly } from "@/lib/pricing"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const term = parseInt(searchParams.get("term") || "1") as BillingTerm
    const category = searchParams.get("category") || "vps"

    const products = await prisma.product.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    // Transform products with pricing for requested term
    const transformedProducts = products.map((product) => {
      const monthlyPrice = getProductPrice(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          cpuCores: product.cpuCores,
          ramGb: product.ramGb,
          storageGb: product.storageGb,
          storageType: product.storageType,
          bandwidthTb: product.bandwidthTb,
          price1m: product.price1m,
          price3m: product.price3m,
          price6m: product.price6m,
          price12m: product.price12m,
          price24m: product.price24m,
          priceHourly: product.priceHourly,
          features: (product.features as string[]) || [],
        },
        term
      )

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        cpuCores: product.cpuCores,
        ramGb: product.ramGb,
        storageGb: product.storageGb,
        storageType: product.storageType,
        bandwidthTb: product.bandwidthTb,
        pricing: {
          monthly: product.price1m,
          termPrice: monthlyPrice,
          hourly: monthlyToHourly(monthlyPrice),
          term,
          termTotal: monthlyPrice * term,
        },
        features: (product.features as string[]) || [],
        isFeatured: product.isFeatured,
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
