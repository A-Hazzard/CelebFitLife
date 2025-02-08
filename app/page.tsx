import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-brandBlack text-brandWhite">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Image
            width={100}
            height={100}
            src="/og-image.jpg"
            alt="CelebFitLife Logo"
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-2xl font-bold">CelebFitLife</h1>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a
                href="/login"
                className="transition-colors duration-300 hover:text-brandOrange"
              >
                Login
              </a>
            </li>
            <li>
              <a
                href="/register"
                className="transition-colors duration-300 hover:text-brandOrange"
              >
                Sign Up
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col flex-1 items-center justify-center px-4 text-center bg-gradient-to-br from-brandBlack to-brandGray">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
          Workout with Your Favorite Celebrities
        </h2>
        <p className="text-lg max-w-2xl mb-8">
          Join live-streaming fitness sessions and experience interactive
          workouts with top celebrities and fitness instructors. Elevate your
          fitness journey and join our vibrant community today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/register"
            className="px-6 py-3 bg-brandOrange text-brandBlack rounded-md transition-colors duration-300 hover:bg-brandWhite hover:text-brandBlack"
          >
            Get Started
          </a>
          <a
            href="/learn-more"
            className="px-6 py-3 border border-brandOrange rounded-md transition-colors duration-300 hover:bg-brandOrange hover:text-brandBlack"
          >
            Learn More
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm border-t border-brandOrange">
        <p>
          &copy; {new Date().getFullYear()} CelebFitLife. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
