"use client"

import { motion } from "framer-motion"
import { brand } from "@/lib/brand"

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      style={{ pointerEvents: "none" }}
      onAnimationComplete={() => {
        const element = document.getElementById("page-loader")
        if (element) element.remove()
      }}
      id="page-loader"
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="h-12 w-12 rounded-lg"
          style={{
            backgroundImage: `linear-gradient(135deg, ${brand.colors.primaryFrom}, ${brand.colors.primaryTo})`,
          }}
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.p
          className="text-sm font-medium text-neutral-600"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Loading SparkDapp...
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
