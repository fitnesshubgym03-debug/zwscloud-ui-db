import { Users, ShoppingCart, CreditCard, IndianRupee } from "lucide-react"

type Stats = {
  customers: number
  orders: number
  payments: number
  revenue: number
}

export function AdminDashboardStats({ stats }: { stats: Stats }) {
  const statItems = [
    {
      label: "Total Customers",
      value: stats.customers.toLocaleString(),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Total Orders",
      value: stats.orders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      label: "Completed Payments",
      value: stats.payments.toLocaleString(),
      icon: CreditCard,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="glass rounded-xl p-5 transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <div className={`rounded-lg p-2 ${item.bgColor}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
