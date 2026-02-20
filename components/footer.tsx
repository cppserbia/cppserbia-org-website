import Image from "next/image"
import SocialLinks from "./social-links"
import { getCurrentYear } from "@/lib/temporal"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"

export default async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className="border-t border-purple-900/40 bg-[#080814] text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="link-with-icon mb-4">
              <Image src="/images/logo.png" alt="C++ Serbia Logo" width={50} height={50} />
              <span className="text-xl font-bold gradient-brand-text">
                {t('brand')}
              </span>
            </Link>
            <p className="text-gray-400 mb-6">
              {t('description')}
            </p>
            <SocialLinks size="sm" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-300">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-300 transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-purple-300 transition-colors">
                  {t('events')}
                </Link>
              </li>
              <li>
                <Link href="/#join" className="text-gray-400 hover:text-purple-300 transition-colors">
                  {t('joinCommunity')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-300">{t('contact')}</h3>
            <p className="text-gray-400 mb-2">{t('contactQuestion')}</p>
            <p className="text-gray-400">
              {t('emailUs')}{" "}
              <a href="mailto:info@cppserbia.org" className="text-purple-400 hover:text-purple-300">
                info@cppserbia.org
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-purple-900/40 mt-12 pt-6 text-center text-gray-500 text-sm">
          <p>{t('copyright', { year: getCurrentYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
