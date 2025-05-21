import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"
import SocialLinks from "@/components/social-links"
import FeaturedEvents from "@/components/featured-events" // Revert to using the original component

export default async function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c1d] text-white">
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
              width={180}
              height={180}
              className="animate-pulse-slow"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-purple-400 to-blue-400">
            C++ Serbia Community
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
            Join our vibrant community of C++ developers in Serbia. Share knowledge, participate in events, and grow
            your skills with fellow enthusiasts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white"
            >
              <Link href="/events" className="flex items-center gap-2">
                Upcoming Events <Calendar className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-purple-500 text-purple-400 hover:bg-purple-950 hover:text-purple-300"
            >
              <Link href="#join" className="flex items-center gap-2">
                Join Our Community <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-300">About Our Community</h2>
              <p className="text-lg text-gray-300 mb-6">
                C++ Serbia is a community dedicated to promoting C++ programming language and best practices. We bring
                together developers of all skill levels, from beginners to experts.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Our mission is to create a supportive environment where members can learn, share knowledge, and network
                with other C++ enthusiasts.
              </p>
              <p className="text-lg text-gray-300">
                Whether you're looking to improve your skills, find mentorship, or simply connect with like-minded
                developers, C++ Serbia is the place for you.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-full opacity-20 blur-xl animate-pulse-slow"></div>
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
      <section className="py-20 px-4 bg-[#0a0a15]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-center text-purple-300">Featured Events</h2>
          <p className="text-xl text-gray-400 mb-12 text-center">Join us at our next meetups and workshops</p>

          {/* Use the original UpcomingEvents component */}
          <FeaturedEvents limit={3} />

          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Link href="/events" className="flex items-center gap-2">
                View All Events <Calendar className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section id="join" className="py-20 px-4 relative">
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
              <div className="p-4 rounded-lg bg-purple-950/50">
                <h4 className="text-xl font-semibold mb-2 text-red-400">Learn & Grow</h4>
                <p className="text-gray-300">Access workshops, talks, and resources to enhance your C++ skills</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-950/50">
                <h4 className="text-xl font-semibold mb-2 text-blue-400">Network</h4>
                <p className="text-gray-300">Connect with other developers, mentors, and potential employers</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-950/50">
                <h4 className="text-xl font-semibold mb-2 text-purple-400">Contribute</h4>
                <p className="text-gray-300">Share your knowledge and help build a stronger C++ community</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
