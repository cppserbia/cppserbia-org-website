import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"
import SocialLinks from "@/components/social-links"
import FeaturedEvents from "@/components/featured-events"
import { OrganizationSeo } from "@/components/seo/organization-seo"
import { ICalFeedButton } from "@/components/ical-feed-button"
import { RSSFeedButton } from "@/components/rss-feed-button"
import { ScrollLogo } from "@/components/scroll-logo"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export default async function Home() {
  const t = await getTranslations()

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
      <OrganizationSeo />

      {/* Hero Section */}
      <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <ScrollLogo src="/images/logo.png" alt="C++ Serbia Logo" width={162} height={180} />
          <h1 className="relative z-10 text-4xl md:text-6xl font-bold mb-6 gradient-brand-text">
            {t('hero.title')}
          </h1>
          <p className="relative z-10 text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted">
            {t('hero.subtitle')}
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="gradient-brand-button text-white"
            >
              <Link href="/events" className="flex-start gap-2">
                {t('hero.upcomingEvents')} <Calendar className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500 text-purple-400 hover:bg-purple-950 hover:text-purple-300"
            >
              <Link href="#join" className="flex-start gap-2">
                {t('hero.joinCommunity')} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-spacing relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-300">{t('about.title')}</h2>
              <p className="text-lg text-muted mb-6">
                {t('about.paragraph1')}
              </p>
              <p className="text-lg text-muted mb-6">
                {t('about.paragraph2')}
              </p>
              <p className="text-lg text-muted">
                {t('about.paragraph3')}
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 gradient-brand-glow rounded-full"></div>
                <Image
                  src="/images/profile_picture.png"
                  alt="C++ Serbia"
                  width={300}
                  height={300}
                  className="relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Preview Section */}
      <section className="section-spacing section-bg-alt">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-purple-300">{t('featuredEvents.title')}</h2>
          <p className="text-xl text-gray-400 mb-12 text-center">{t('featuredEvents.subtitle')}</p>

          <FeaturedEvents limit={3} />

          <div className="mt-12 flex flex-col items-center gap-6">
            <Button
              size="lg"
              className="gradient-brand-button text-white"
            >
              <Link href="/events" className="flex items-center gap-2">
                {t('featuredEvents.viewAll')} <Calendar className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex flex-wrap justify-center gap-4">
              <RSSFeedButton />
              <ICalFeedButton />
            </div>
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section id="join" className="section-spacing relative">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-purple-300">{t('joinSection.title')}</h2>
          <p className="text-xl text-gray-400 mb-12 text-center">{t('joinSection.subtitle')}</p>

          <SocialLinks />

          <div className="mt-16 p-8 border border-purple-900 rounded-xl bg-[#0c0c1d]/80 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-4 text-purple-300">{t('joinSection.whyJoin')}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-red-400">{t('joinSection.learnTitle')}</h4>
                <p className="text-muted">{t('joinSection.learnDescription')}</p>
              </div>
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-blue-400">{t('joinSection.networkTitle')}</h4>
                <p className="text-muted">{t('joinSection.networkDescription')}</p>
              </div>
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-brand-purple">{t('joinSection.contributeTitle')}</h4>
                <p className="text-muted">{t('joinSection.contributeDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
