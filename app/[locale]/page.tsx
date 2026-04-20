import { ArrowRight, Calendar } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import FeaturedEvents from "@/components/featured-events";
import { ICalFeedButton } from "@/components/ical-feed-button";
import { RSSFeedButton } from "@/components/rss-feed-button";
import { ScrollLogo } from "@/components/scroll-logo";
import { OrganizationSeo } from "@/components/seo/organization-seo";
import SocialLinks from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://cppserbia.org";

  return {
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        sr: `${baseUrl}/sr`,
        "x-default": `${baseUrl}/en`,
      },
    },
  };
}

export default async function Home() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c1d] text-white">
      <OrganizationSeo />

      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/images/wallpaper.png')" }}
        />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <ScrollLogo src="/images/logo.png" alt="C++ Serbia Logo" width={162} height={180} />
          <h1 className="gradient-brand-text relative z-10 mb-6 text-4xl font-bold md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="relative z-10 mx-auto mb-8 max-w-3xl text-xl text-muted md:text-2xl">
            {t("hero.subtitle")}
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gradient-brand-button text-white">
              <Link href="/events" className="flex-start gap-2">
                {t("hero.upcomingEvents")} <Calendar className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500 text-purple-400 hover:bg-purple-950 hover:text-purple-300"
            >
              <Link href="#join" className="flex-start gap-2">
                {t("hero.joinCommunity")} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-spacing relative">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <div className="md:w-1/2">
              <h2 className="mb-6 text-3xl font-bold text-purple-300 md:text-4xl">
                {t("about.title")}
              </h2>
              <p className="mb-6 text-lg text-muted">{t("about.paragraph1")}</p>
              <p className="mb-6 text-lg text-muted">{t("about.paragraph2")}</p>
              <p className="text-lg text-muted">{t("about.paragraph3")}</p>
            </div>
            <div className="flex justify-center md:w-1/2">
              <div className="relative h-80 w-80">
                <div className="gradient-brand-glow absolute inset-0 rounded-full"></div>
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
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-purple-300 md:text-4xl">
            {t("featuredEvents.title")}
          </h2>
          <p className="mb-12 text-center text-xl text-gray-400">{t("featuredEvents.subtitle")}</p>

          <FeaturedEvents limit={3} />

          <div className="mt-12 flex flex-col items-center gap-6">
            <Button size="lg" className="gradient-brand-button text-white">
              <Link href="/events" className="flex items-center gap-2">
                {t("featuredEvents.viewAll")} <Calendar className="h-5 w-5" />
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
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-purple-300 md:text-4xl">
            {t("joinSection.title")}
          </h2>
          <p className="mb-12 text-center text-xl text-gray-400">{t("joinSection.subtitle")}</p>

          <SocialLinks />

          <div className="mt-16 rounded-xl border border-purple-900 bg-[#0c0c1d]/80 p-8 backdrop-blur-sm">
            <h3 className="mb-4 text-2xl font-bold text-purple-300">{t("joinSection.whyJoin")}</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-card-dark rounded-lg p-4">
                <h4 className="mb-2 text-xl font-semibold text-red-400">
                  {t("joinSection.learnTitle")}
                </h4>
                <p className="text-muted">{t("joinSection.learnDescription")}</p>
              </div>
              <div className="bg-card-dark rounded-lg p-4">
                <h4 className="mb-2 text-xl font-semibold text-blue-400">
                  {t("joinSection.networkTitle")}
                </h4>
                <p className="text-muted">{t("joinSection.networkDescription")}</p>
              </div>
              <div className="bg-card-dark rounded-lg p-4">
                <h4 className="text-brand-purple mb-2 text-xl font-semibold">
                  {t("joinSection.contributeTitle")}
                </h4>
                <p className="text-muted">{t("joinSection.contributeDescription")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
