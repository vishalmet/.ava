import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, FileCode2, Shield, Zap, Cpu, Rocket, Sparkles, CheckCircle } from "lucide-react"

export default function FeaturesGrid() {
  const features = [
    {
      icon: Code,
      title: "Simple Syntax",
      desc: "Easy-to-learn programming language designed for clarity and simplicity.",
      tag: "Easy Learning",
    },
    {
      icon: FileCode2,
      title: "Multi-Language Output",
      desc: "Write once, automatically convert to Solidity, Rust, Cairo, and more.",
      tag: "Auto-Conversion",
    },
    {
      icon: Shield,
      title: "Built-in Verification",
      desc: "Every program includes proof of execution for trust and reliability.",
      tag: "Trust & Security",
    },
    {
      icon: Zap,
      title: "Fast Development",
      desc: "Build and deploy faster with simplified coding and automatic conversion.",
      tag: "Speed",
    },
    {
      icon: Cpu,
      title: "Cross-Platform",
      desc: "Deploy to multiple blockchains from the same codebase without rewriting.",
      tag: "Multi-Chain",
    },
    {
      icon: Rocket,
      title: "One-Click Deploy",
      desc: "Deploy to any supported network instantly with built-in verification.",
      tag: "Easy Deployment",
    },
    {
      icon: Sparkles,
      title: "Smart Contracts",
      desc: "Create and deploy smart contracts with ease using simple syntax.",
      tag: "Blockchain Ready",
    },
    {
      icon: CheckCircle,
      title: "Execution Proof",
      desc: "Generate mathematical proof that your code runs exactly as intended.",
      tag: "Verification",
    },
  ]

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
          Features designed for everyone
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Why choose ava for your next project?
        </h2>
        <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
          A programming language that makes coding accessible, powerful, and verifiable. 
          Write simple code that works everywhere.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="relative overflow-hidden border-rose-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="relative">
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, #e84142, #f59e0b)`,
                }}
              >
                <f.icon className="h-4 w-4" />
              </div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <Badge variant="secondary" className="bg-rose-100 text-rose-900 border-rose-300">
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
