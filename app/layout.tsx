import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { SettingsModal } from "@/components/SettingsModal";
import { AssistantWidget } from "@/components/AssistantWidget";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Data Analysis Using AI — 2-Hour Practical Lab",
  description: "Interactive training app: AI-assisted data analysis for HR, L&D, Recruitment, Procurement, Finance, Admin, IR and Legal — with a LangGraph agent sandbox powered by your own Groq key.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">{children}</main>
          <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-500">
            Built for the &ldquo;Data Analysis Using AI&rdquo; workshop · Sample data is synthetic · AI output must be validated by a human before use
          </footer>
          <SettingsModal />
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
