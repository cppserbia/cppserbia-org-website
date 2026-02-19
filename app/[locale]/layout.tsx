import type React from "react"
import type { Metadata } from "next"
import { Rubik, JetBrains_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import "../globals.css"

const rubik = Rubik({ subsets: ["latin", "latin-ext", "cyrillic"] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-jetbrains-mono"
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const baseUrl = 'https://cppserbia.org'
  const alternateLanguages: Record<string, string> = {}
  for (const loc of routing.locales) {
    alternateLanguages[loc] = `${baseUrl}/${loc}`
  }

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    generator: 'Next.js',
    applicationName: t('applicationName'),
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
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: baseUrl,
      siteName: "C++ Serbia",
      images: [
        {
          url: "/images/logo.png",
          width: 1200,
          height: 630,
          alt: "C++ Serbia Community Logo"
        }
      ],
      locale: locale === 'sr' ? 'sr_RS' : 'en_US',
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: t('ogTitle'),
      description: t('ogDescription'),
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
      languages: alternateLanguages,
      types: {
        'application/rss+xml': [
          { url: 'https://cppserbia.org/events/feed.xml', title: 'C++ Serbia Events RSS Feed' }
        ]
      }
    },
    verification: {
      google: 'google-site-verification-code',
    },
    category: 'technology',
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${rubik.className} ${jetbrainsMono.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Navbar />
            {children}
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
