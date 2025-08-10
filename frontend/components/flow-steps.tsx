import { ArrowRight, Edit3, Cpu, FileCode2, Rocket, Code, CheckCircle } from "lucide-react"

export default function FlowSteps() {
  const steps = [
    {
      title: "Write",
      desc: "Write simple code in .ava syntax.",
      icon: Code,
    },
    {
      title: "Convert",
      desc: "Automatically convert to multiple languages.",
      icon: FileCode2,
    },
    {
      title: "Verify",
      desc: "Get proof of execution for trust.",
      icon: CheckCircle,
    },
    {
      title: "Deploy",
      desc: "Deploy to any supported blockchain.",
      icon: Rocket,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
          How it works
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">From idea to deployment in four simple steps</h2>
        <p className="mx-auto mt-2 max-w-[70ch] text-neutral-600">
          Write simple code, convert to multiple languages, verify execution, and deploy anywhere.
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
