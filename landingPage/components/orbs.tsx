"use client"

import { motion } from "framer-motion"

type OrbProps = {
  className?: string
  color?: string
  size?: number
  duration?: number
  delay?: number
  blur?: number
  opacity?: number
}

export default function Orbs({
  className,
  color = "rgb(232 65 66 / 0.25)", // rose
  size = 240,
  duration = 12,
  delay = 0,
  blur = 80,
  opacity = 0.8,
}: OrbProps) {
  return (
    <div className={className}>
      <motion.div
        initial={{ y: 0, x: 0, opacity }}
        animate={{ y: [0, -20, 0, 20, 0], x: [0, 15, 0, -15, 0] }}
        transition={{ duration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay }}
        style={{
          width: size,
          height: size,
          borderRadius: size,
          filter: `blur(${blur}px)`,
          background: color,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
