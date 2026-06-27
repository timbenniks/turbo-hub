import { Geist_Mono, Source_Sans_3 } from "next/font/google"

import "./globals.css"
import { ThemeProvider, themeScript } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const ss3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        ss3.variable
      )}
    >
      <head>
        {/* Set the theme class before paint to avoid a flash (server-only). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
