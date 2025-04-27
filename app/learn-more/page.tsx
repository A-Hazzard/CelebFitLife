import Link from "next/link";
import Header from "@/components/layout/Header";

export default function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-brandBlack text-brandWhite">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 px-4 text-center bg-gradient-to-br from-brandBlack to-brandGray">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8">
            Learn More about CelebFitLife
          </h2>
          <p className="text-lg max-w-3xl mx-auto mb-12">
            CelebFitLife is the live-streaming fitness platform that connects
            you with your favorite celebrities and top fitness instructors.
            Experience interactive workouts, join exclusive Q&amp;A sessions,
            and become part of a vibrant community dedicated to a healthier
            lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
            >
              Get Started
            </Link>
            <Link
              href="/features"
              className="px-6 py-3 border border-brandOrange rounded-md transition-colors duration-300 hover:bg-brandOrange hover:text-brandBlack"
            >
              Explore Features
            </Link>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-12 px-4 max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold mb-6">Our Vision &amp; Mission</h3>
          <p className="mb-4 text-lg">
            At CelebFitLife, we believe that fitness should be fun, accessible,
            and interactive. Our platform enables fans to workout with the
            celebrities they admire, turning exercise into an engaging social
            experience. We are committed to bringing top-tier fitness content
            directly to you in a live, interactive format.
          </p>
          <p className="text-lg">
            Whether you are looking to kickstart your fitness journey or want to
            challenge yourself alongside your favorite stars, CelebFitLife
            provides the perfect environment to stay motivated and achieve your
            health goals.
          </p>
        </section>

        {/* Features Section */}
        <section className="py-12 px-4 bg-brandGray text-brandBlack">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">Features</h3>
            <ul className="space-y-4 text-lg">
              <li>
                Live-streaming workouts with top celebrities and fitness
                instructors.
              </li>
              <li>Interactive chat and live polls during sessions.</li>
              <li>Exclusive Q&amp;A sessions and VIP community access.</li>
              <li>Multiple subscription plans tailored to your needs.</li>
              <li>Easy-to-use platform with a modern, responsive design.</li>
              <li>
                Access to replays and workout archives for ongoing motivation.
              </li>
            </ul>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-6 text-left">
              Subscription Plans
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
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 px-4 bg-brandGray text-brandBlack">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">How It Works</h3>
            <ol className="space-y-4 text-lg list-decimal list-inside">
              <li>
                <strong>Sign Up:</strong> Create an account and choose the plan
                that fits you.
              </li>
              <li>
                <strong>Subscribe:</strong> Gain access to live workouts,
                replays, and exclusive content.
              </li>
              <li>
                <strong>Stream Live:</strong> Join live sessions with
                celebrities and fitness experts.
              </li>
              <li>
                <strong>Engage:</strong> Interact through chat, polls, and
                Q&amp;A sessions.
              </li>
              <li>
                <strong>Replays & More:</strong> Access past sessions and stay
                motivated on your fitness journey.
              </li>
            </ol>
          </div>
        </section>
      </main>

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
