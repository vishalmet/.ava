import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Replace, FileCode2, Rocket, Wand2, Boxes } from "lucide-react"

export default function FeaturesGrid() {
  const features = [
    {
      title: "Prompt → App",
      desc: "Describe what you want. We generate pages, components, data flows, and wallet interactions automatically.",
      icon: Sparkles,
      tone: "from-fuchsia-500 to-amber-400",
      tag: "AI Generation",
    },
    {
      title: "Swap Components",
      desc: "Pick from a curated component library. Swap layouts, lists, forms, and dashboards instantly—no rewiring.",
      icon: Replace,
      tone: "from-lime-500 to-teal-400",
      tag: "Design Freedom",
    },
    {
      title: "Smart Contracts",
      desc: "Production-ready Solidity contracts with tests and deploy scripts. Configure parameters and permissions.",
      icon: FileCode2,
      tone: "from-amber-500 to-rose-400",
      tag: "Onchain",
    },
    {
      title: "Deploy to Avalanche",
      desc: "One-click deploy to Avalanche mainnet or Fuji. Automatic verification and environment wiring.",
      icon: Rocket,
      tone: "from-rose-500 to-amber-400",
      tag: "Shipping",
    },
    {
      title: "Templates & Blocks",
      desc: "Start from best-practice templates for marketplaces, crowdfunding, DAOs, or explorers.",
      icon: Boxes,
      tone: "from-fuchsia-500 to-lime-400",
      tag: "Speed",
    },
    {
      title: "Instant Iteration",
      desc: "Regenerate specific screens or swap components without losing your data model or contract state.",
      icon: Wand2,
      tone: "from-teal-500 to-lime-400",
      tag: "Iterate",
    },
  ]

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
          Features designed for builders
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Build faster with bright, flexible components
        </h2>
        <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
          Everything you need to go from idea to deployed dApp in minutes. No code required.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="relative overflow-hidden border-amber-100 bg-white p-5 shadow-sm">
            <div
              className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${f.tone} opacity-20 blur-2xl`}
            />
            <div className="relative">
              <div
                className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br ${f.tone} text-white`}
              >
                <f.icon className="h-4 w-4" />
              </div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <Badge variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">
                  {f.tag}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
