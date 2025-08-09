import { ArrowRight, Edit3, Cpu, FileCode2, Rocket } from "lucide-react"

export default function FlowSteps() {
  const steps = [
    {
      title: "Prompt",
      desc: "Describe your app’s pages, flows, and onchain features.",
      icon: Edit3,
      color: "from-fuchsia-500 to-amber-400",
    },
    {
      title: "Generate",
      desc: "We create UI, logic, and data based on your prompt.",
      icon: Cpu,
      color: "from-lime-500 to-teal-400",
    },
    {
      title: "Contracts",
      desc: "We synthesize Solidity contracts with tests and configs.",
      icon: FileCode2,
      color: "from-amber-500 to-rose-400",
    },
    {
      title: "Deploy",
      desc: "Ship to Avalanche with one click. Verify & go live.",
      icon: Rocket,
      color: "from-rose-500 to-amber-400",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
          How it works
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">From idea to Avalanche in four steps</h2>
        <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
          Your vision, our pipelines. Generate, refine, swap, and deploy without touching code.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-xl border bg-white p-5 shadow-sm">
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${s.color} text-white`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden lg:block">
                <ArrowRight className="absolute -right-3 top-8 h-6 w-6 text-neutral-300" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
