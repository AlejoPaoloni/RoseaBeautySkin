"use client";

import { motion } from "framer-motion";

export default function Sparkle({
  className = "h-4 w-4",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.1, 0.85] }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <path d="M12 0c.7 4.4 2 8 4.1 10.1S22.4 13.3 24 12c-4.4.7-8 2-10.1 4.1S13.3 22.4 12 24c-.7-4.4-2-8-4.1-10.1S1.6 10.7 0 12c4.4-.7 8-2 10.1-4.1S10.7 1.6 12 0Z" />
    </motion.svg>
  );
}
