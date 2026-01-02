import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EDCalmSim",
  description: "Emergency department calm simulation prototype"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-800 bg-slate-900">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <div className="text-lg font-semibold">EDCalmSim</div>
              <nav className="flex items-center gap-4 text-sm text-slate-300">
                <a href="/">Start Simulation</a>
                <a href="/sim/session-001">Simulation</a>
                <a href="/results/session-001">Results</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
