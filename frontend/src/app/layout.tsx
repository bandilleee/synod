import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/shared"
import { Toaster } from "@/components/ui/sonner"

const montserrat = Montserrat({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Synod",
  description: "Collaboration platform for community leaders",
  icons: {
    icon: [{ url: "/logo-bg.png", type: "image/png" }],
    shortcut: "/logo-bg.png",
    apple: "/logo-bg.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={montserrat.className + " bg-[#050505] text-zinc-400 antialiased"}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
