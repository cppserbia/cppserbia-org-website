import type React from "react"
import type { Metadata } from "next"
import { Rubik, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const rubik = Rubik({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono"
})

export const metadata: Metadata = {
  metadataBase: new URL('https://cppserbia.org'),
  title: {
    default: "C++ Serbia Community",
    template: "%s - C++ Serbia Community"
  },
  description: "Join the vibrant community of C++ developers in Serbia. Discover events, meetups, workshops, and connect with fellow C++ enthusiasts.",
  generator: 'Next.js',
  applicationName: 'C++ Serbia Community',
  keywords: ['C++', 'programming', 'Serbia', 'Belgrade', 'community', 'meetup', 'technology', 'software development'],
  authors: [{ name: 'C++ Serbia Community' }],
  creator: 'C++ Serbia Community',
  publisher: 'C++ Serbia Community',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    title: "C++ Serbia Community",
    description: "Join the vibrant community of C++ developers in Serbia. Discover events, meetups, workshops, and connect with fellow C++ enthusiasts.",
    url: "https://cppserbia.org",
    siteName: "C++ Serbia",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "C++ Serbia Community Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "C++ Serbia Community",
    description: "Join the vibrant community of C++ developers in Serbia. Discover events, meetups, workshops, and connect with fellow C++ enthusiasts.",
    images: ["/images/logo.png"],
    creator: "@cppserbia",
    site: "@cppserbia"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': [
        { url: 'https://cppserbia.org/events/feed.xml', title: 'C++ Serbia Events RSS Feed' }
      ]
    }
  },
  verification: {
    google: 'google-site-verification-code', // You'll need to add your actual verification code
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rubik.className} ${jetbrainsMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Navbar />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
