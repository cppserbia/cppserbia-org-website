import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Rss } from "lucide-react"
import SocialLinks from "@/components/social-links"
import FeaturedEvents from "@/components/featured-events"
import { OrganizationSeo } from "@/components/seo/organization-seo"
import { ICalFeedButton } from "@/components/ical-feed-button"

export default async function Home() {
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
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logo.png"
              alt="C++ Serbia Logo"
              width={162}
              height={180}
              className="animate-pulse-slow"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-brand-text">
            C++ Serbia Community
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted">
            Join our vibrant community of C++ developers in Serbia. Share knowledge, participate in events, and grow
            your skills with fellow enthusiasts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="gradient-brand-button text-white"
            >
              <Link href="/events" className="flex-start gap-2">
                Upcoming Events <Calendar className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500 text-purple-400 hover:bg-purple-950 hover:text-purple-300"
            >
              <Link href="#join" className="flex-start gap-2">
                Join Our Community <ArrowRight className="h-5 w-5" />
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-300">About Our Community</h2>
              <p className="text-lg text-muted mb-6">
                C++ Serbia is a community dedicated to promoting C++ programming language and best practices. We bring
                together developers of all skill levels, from beginners to experts.
              </p>
              <p className="text-lg text-muted mb-6">
                Our mission is to create a supportive environment where members can learn, share knowledge, and network
                with other C++ enthusiasts.
              </p>
              <p className="text-lg text-muted">
                Whether you&apos;re looking to improve your skills, find mentorship, or simply connect with like-minded
                developers, C++ Serbia is the place for you.
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
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-purple-300">Featured Events</h2>
          <p className="text-xl text-gray-400 mb-12 text-center">Join us at our next meetups and workshops</p>

          {/* Use the original UpcomingEvents component */}
          <FeaturedEvents limit={3} />

          <div className="mt-12 flex flex-col items-center gap-6">
            <Button
              size="lg"
              className="gradient-brand-button text-white"
            >
              <Link href="/events" className="flex items-center gap-2">
                View All Events <Calendar className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-500 text-orange-400 hover:bg-orange-950 hover:text-orange-300"
                asChild
              >
                <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  RSS Feed <Rss className="h-4 w-4" />
                </a>
              </Button>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-purple-300">Join Our Community</h2>
          <p className="text-xl text-gray-400 mb-12 text-center">Connect with us on these platforms</p>

          <SocialLinks />

          <div className="mt-16 p-8 border border-purple-900 rounded-xl bg-[#0c0c1d]/80 backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-4 text-purple-300">Why Join C++ Serbia?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-red-400">Learn & Grow</h4>
                <p className="text-muted">Access workshops, talks, and resources to enhance your C++ skills</p>
              </div>
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-blue-400">Network</h4>
                <p className="text-muted">Connect with other developers, mentors, and potential employers</p>
              </div>
              <div className="p-4 rounded-lg bg-card-dark">
                <h4 className="text-xl font-semibold mb-2 text-brand-purple">Contribute</h4>
                <p className="text-muted">Share your knowledge and help build a stronger C++ community</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
