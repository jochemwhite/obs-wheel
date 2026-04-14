import { ToastProvider } from "@/components/Toast";
import { AppInit } from "@/components/AppInit";
import { WheelSection } from "@/components/wheel/WheelSection";
import { ItemPanel } from "@/components/panel/ItemPanel";
import { WebSocketPanel } from "@/components/WebSocketPanel";
import { WinnerModal } from "@/components/WinnerModal";

export default function Home() {
  return (
    <ToastProvider>
      <AppInit />

      <div className="flex flex-col items-center min-h-screen px-4 pt-5 pb-16">
        {/* Header */}
        <header className="text-center mb-8">
          <h1
            className="font-[family-name:var(--font-bungee)] tracking-[2px] text-[clamp(2rem,6vw,3.4rem)]"
            style={{
              background: "linear-gradient(90deg, #ff5f6d, #f0c040, #ff5f6d)",
              backgroundSize: "200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}
          >
            🎡 Wheel of Fortune
          </h1>
          <p className="text-[#6b6b88] text-sm mt-1.5">
            Spin to decide — because every choice deserves drama.
          </p>
        </header>

        {/* Main layout */}
        <main className="flex flex-wrap gap-7 justify-center w-full max-w-[1100px]">
          <WheelSection />

          {/* Right column: items + websocket */}
          <div className="flex flex-col gap-5 flex-1 min-w-[280px] max-w-[400px]">
            <ItemPanel />
            <WebSocketPanel />
          </div>
        </main>
      </div>

      <WinnerModal />
    </ToastProvider>
  );
}
