import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getCurrentYear } from "@/lib/temporal";

import SocialLinks from "./social-links";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-purple-900/40 bg-[#080814] text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <Link href="/" className="link-with-icon mb-4">
              <Image src="/images/logo.png" alt="C++ Serbia Logo" width={50} height={50} />
              <span className="gradient-brand-text text-xl font-bold">{t("brand")}</span>
            </Link>
            <p className="mb-6 text-gray-400">{t("description")}</p>
            <SocialLinks size="sm" />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-purple-300">{t("quickLinks")}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 transition-colors hover:text-purple-300">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-gray-400 transition-colors hover:text-purple-300"
                >
                  {t("events")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#join"
                  className="text-gray-400 transition-colors hover:text-purple-300"
                >
                  {t("joinCommunity")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-purple-300">{t("contact")}</h3>
            <p className="mb-2 text-gray-400">{t("contactQuestion")}</p>
            <p className="text-gray-400">
              {t("emailUs")}{" "}
              <a href="mailto:info@cppserbia.org" className="text-purple-400 hover:text-purple-300">
                info@cppserbia.org
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-purple-900/40 pt-6 text-center text-sm text-gray-500">
          <p>{t("copyright", { year: getCurrentYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
