import Link from "next/link"
import Image from "next/image"
import SocialLinks from "./social-links"
import { getCurrentYear } from "@/lib/temporal"

export default function Footer() {
  return (
    <footer className="border-t border-purple-900/40 bg-[#080814] text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="link-with-icon mb-4">
              <Image src="/images/logo.png" alt="C++ Serbia Logo" width={50} height={50} />
              <span className="text-xl font-bold gradient-brand-text">
                C++ Serbia
              </span>
            </Link>
            <p className="text-gray-400 mb-6">
              A community of C++ developers in Serbia dedicated to sharing knowledge and promoting best practices.
            </p>
            <SocialLinks size="sm" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-purple-300 transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/#join" className="text-gray-400 hover:text-purple-300 transition-colors">
                  Join Community
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-300">Contact</h3>
            <p className="text-gray-400 mb-2">Have questions or want to get involved?</p>
            <p className="text-gray-400">
              Email us at:{" "}
              <a href="mailto:info@cppserbia.org" className="text-purple-400 hover:text-purple-300">
                info@cppserbia.org
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-purple-900/40 mt-12 pt-6 text-center text-gray-500 text-sm">
          <p>© {getCurrentYear()} C++ Serbia Community. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
