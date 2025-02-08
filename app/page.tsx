"use client";
import LandingHeader from "@/components/layout/landing/Header";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brandBlack text-brandWhite">
      <LandingHeader />


      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center mt-12">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Workout with Your Favorite Celebrities
        </h2>
        <p className="text-lg max-w-2xl mb-8">
          Join live-streaming fitness sessions with top celebrities and fitness
          instructors. Experience interactive workouts, exclusive Q&amp;A
          sessions, and a vibrant community to elevate your fitness journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href="/register"
            className="px-6 py-3 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
          >
            Get Started
          </Link>
          <Link
            href="/learn-more"
            className="px-6 py-3 border border-brandOrange rounded-md transition-colors duration-300 hover:bg-brandOrange hover:text-brandBlack"
          >
            Learn More
          </Link>
        </div>

        {/* Choose Your Plan Section */}
        <section className="w-full max-w-6xl px-4 mb-12">
          <h3 className="text-3xl font-bold mb-6 text-left">
            Choose Your Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-6 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Basic</h4>
              <p className="text-3xl font-bold text-brandOrange mb-2">
                $9.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-2 flex-1">
                <li>Access to 1 streamer</li>
                <li>Live workouts &amp; replays</li>
                <li>1 minute free previews</li>
                <li>Basic chat access</li>
              </ul>
              <Link
                href="/register"
                className="mt-4 inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
            {/* Plus Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-6 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Plus</h4>
              <p className="text-3xl font-bold text-brandOrange mb-2">
                $19.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-2 flex-1">
                <li>Access to 3 streamers</li>
                <li>Live workouts &amp; replays</li>
                <li>Exclusive Q&amp;A sessions</li>
                <li>Priority chat access</li>
              </ul>
              <Link
                href="/register"
                className="mt-4 inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
            {/* Unlimited Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-6 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Unlimited</h4>
              <p className="text-3xl font-bold text-brandOrange mb-2">
                $29.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-2 flex-1">
                <li>Unlimited streamers</li>
                <li>Exclusive fitness challenges</li>
                <li>One-to-one coaching sessions</li>
                <li>VIP chat access &amp; badges</li>
              </ul>
              <Link
                href="/register"
                className="mt-4 inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Contact Section */}
      <section id="contact" className="w-full max-w-4xl mx-auto px-4 mb-12">
        <h3 className="text-3xl font-bold mb-6 text-center text-brandWhite">
          Contact Us
        </h3>
        <p className="mb-6 text-center text-brandGray">
          Have questions or feedback? Get in touch with us!
        </p>
        <form className="bg-brandWhite text-brandBlack p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label htmlFor="contact-name" className="block mb-1 font-semibold">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              placeholder="Your name"
              className="w-full border border-brandGray rounded-md px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contact-email" className="block mb-1 font-semibold">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              placeholder="Your email"
              className="w-full border border-brandGray rounded-md px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="contact-message"
              className="block mb-1 font-semibold"
            >
              Message
            </label>
            <textarea
              id="contact-message"
              placeholder="Your message"
              rows={5}
              className="w-full border border-brandGray rounded-md px-3 py-2"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="p-4 border-t border-brandOrange text-center">
        <p className="mb-2">
          &copy; {new Date().getFullYear()} CelebFitLife. All rights reserved.
        </p>
        <p>
          <Link href="#contact" className="text-brandOrange hover:underline">
            Contact Us
          </Link>{" "}
          |{" "}
          <Link href="/privacy" className="text-brandOrange hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
