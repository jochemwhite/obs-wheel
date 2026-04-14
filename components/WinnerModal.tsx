"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWheelStore } from "@/store/wheel-store";
import { WIN_EMOJIS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function WinnerModal() {
  const winner         = useWheelStore((s) => s.winner);
  const showModal      = useWheelStore((s) => s.showWinnerModal);
  const setShowModal   = useWheelStore((s) => s.setShowWinnerModal);
  const items          = useWheelStore((s) => s.items);

  const emoji = winner
    ? WIN_EMOJIS[items.indexOf(winner) % WIN_EMOJIS.length]
    : "🏆";

  function close() {
    setShowModal(false);
  }

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-[6px] flex items-center justify-center z-[200]"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            exit={{ scale: 0.88,    opacity: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 200 }}
            className="bg-[#16161f] border border-[#2a2a3d] rounded-[20px] px-9 py-10 text-center max-w-[360px] w-[90%]"
            style={{ boxShadow: "0 0 60px rgba(240,192,64,0.2)" }}
          >
            <div className="text-[3.6rem] leading-none mb-3">{emoji}</div>

            <h2 className="font-[family-name:var(--font-bungee)] text-[#f0c040] text-2xl mb-1.5">
              We Have a Winner!
            </h2>

            <div className="text-[1.35rem] font-semibold text-[#e8e8f0] break-words mb-6 px-4 py-2.5 bg-[#1e1e2e] rounded-[10px] border border-[#2a2a3d]">
              {winner?.label}
            </div>

            <Button variant="close" size="lg" onClick={close}>
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
