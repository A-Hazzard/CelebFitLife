import Link from "next/link";
import Header from "@/components/layout/Header";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite font-inter">
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-6 py-20 space-y-16">
        {/* Hero Section */}
        <section className="text-center">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8">
            Explore CelebFitLife Features
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-12">
            Discover how CelebFitLife transforms your fitness journey—join live
            workouts with your favorite celebrities, interact via real‑time chat
            and polls, and choose the perfect plan to match your lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Choose Your Plan Section */}
        <section className="text-center w-9/12 mx-auto">
          <h3 className="text-3xl font-bold mb-8">Choose Your Plan</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Basic Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-8 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Basic</h4>
              <p className="text-3xl font-bold text-brandOrange mb-4">
                $9.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-3 mb-4">
                <li>Access to 1 streamer</li>
                <li>Live workouts &amp; replays</li>
                <li>1 minute free previews</li>
                <li>Basic chat access</li>
              </ul>
              <p className="text-sm text-white mb-6">
                Perfect for beginners who want to sample our interactive workout
                sessions.
              </p>
              <Link
                href="/register"
                className="inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
            {/* Plus Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-8 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Plus</h4>
              <p className="text-3xl font-bold text-brandOrange mb-4">
                $19.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-3 mb-4">
                <li>Access to 3 streamers</li>
                <li>Live workouts &amp; replays</li>
                <li>Exclusive Q&amp;A sessions</li>
                <li>Priority chat access</li>
              </ul>
              <p className="text-sm text-white mb-6">
                Ideal for enthusiasts who crave more variety and direct access
                to fitness experts.
              </p>
              <Link
                href="/register"
                className="inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
            {/* Unlimited Plan */}
            <div className="bg-brandBlack border border-brandGray rounded-lg p-8 flex flex-col text-left">
              <h4 className="text-xl font-bold text-white mb-4">Unlimited</h4>
              <p className="text-3xl font-bold text-brandOrange mb-4">
                $29.99<span className="text-lg">/month</span>
              </p>
              <ul className="text-white space-y-3 mb-4">
                <li>Unlimited streamers</li>
                <li>Exclusive fitness challenges</li>
                <li>One-to-one coaching sessions</li>
                <li>VIP chat access &amp; badges</li>
              </ul>
              <p className="text-sm text-white mb-6">
                The ultimate experience for dedicated users—get personalized
                coaching and exclusive benefits.
              </p>
              <Link
                href="/register"
                className="inline-block px-4 py-2 bg-brandOrange text-brandBlack rounded transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
              >
                Choose Plan
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="text-center">
          <h3 className="text-3xl font-bold mb-8">Why Choose CelebFitLife?</h3>
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-left">
            <p>
              <strong>Engage Live:</strong> Experience interactive workouts in
              real time with your favorite celebrities. Chat, ask questions, and
              join live polls.
            </p>
            <p>
              <strong>Flexible Options:</strong> Our Basic, Plus, and Unlimited
              plans cater to every fitness need—from casual workouts to
              personalized coaching.
            </p>
            <p>
              <strong>High-Quality Content:</strong> Enjoy professionally
              produced workout sessions, on-demand replays, and exclusive
              behind-the-scenes content.
            </p>
            <p>
              <strong>Community Driven:</strong> Become part of a vibrant,
              supportive community that motivates and inspires you to achieve
              your fitness goals.
            </p>
            <p>
              <strong>Personalized Experience:</strong> With our Unlimited plan,
              get one-to-one coaching sessions and VIP chat features for a truly
              tailored workout experience.
            </p>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center py-12">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Fitness Journey?
          </h3>
          <p className="text-xl mb-8">
            Join CelebFitLife today and workout with the stars!
          </p>
          <Link
            href="/register"
            className="px-8 py-4 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack inline-block"
          >
            Get Started
          </Link>
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
