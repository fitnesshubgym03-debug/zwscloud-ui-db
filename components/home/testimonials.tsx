import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { TestimonialCard } from "@/components/testimonial-card"

const items = [
  {
    quote:
      "Migrating to ZWS Cloud cut our provisioning time from hours to under a minute. Support has been genuinely responsive.",
    author: "Ananya Rao",
    role: "Head of Platform",
    company: "Finstack",
  },
  {
    quote:
      "The custom configurator let us spec machines exactly how we wanted. No awkward upsells, no surprise bills.",
    author: "Michael Chen",
    role: "Staff Engineer",
    company: "Northwave",
  },
  {
    quote:
      "Consistent NVMe performance and sensible defaults. It feels like infrastructure built by people who run infrastructure.",
    author: "Priya Nair",
    role: "CTO",
    company: "Kelvin Labs",
  },
  {
    quote:
      "We switched to ZWS Cloud for their exceptional DDoS protection and low-latency network. The difference is night and day.",
    author: "David Kumar",
    role: "DevOps Lead",
    company: "Streamify",
  },
  {
    quote:
      "Their transparent pricing model is refreshing. No hidden fees, full control, and the performance is incredible for the cost.",
    author: "Sarah Mitchell",
    role: "Founder & CEO",
    company: "DataFlow Systems",
  },
  {
    quote:
      "ZWS Cloud&apos;s 99.99% uptime SLA and lightning-fast support team have been essential for our mission-critical workloads.",
    author: "James Rodriguez",
    role: "Infrastructure Engineer",
    company: "TechCore Solutions",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="flex flex-col gap-12">
        <SectionHeader
          eyebrow="Teams on ZWS Cloud"
          title="What our customers say"
          description="Sample reviews. Replace with verified customer quotes before production launch."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <TestimonialCard key={t.author} {...t} />
          ))}
        </div>
      </Container>
    </section>
  )
}
