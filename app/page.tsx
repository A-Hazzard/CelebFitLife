import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="https://api.builder.io/api/v1/image/assets/TEMP/9a68ee45eaf40a3bd6e1879bb1aa452571257241?width=2880"
            alt="Athletic person training"
            fill
            className="object-cover object-right md:object-center lg:object-[center_30%] xl:object-[center_25%] 2xl:object-[center_20%] xl:!w-1/2 xl:!left-1/4"
            priority
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-4 md:px-6 lg:px-40 py-4 md:py-12">
          <div className="flex items-center">
            <svg width="120" height="22" viewBox="0 0 146 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-[146px] md:h-[26px]">
              <path d="M11.2251 26C4.57318 26 0 21.1294 0 13.035C0 5.01078 4.50389 0 11.2597 0C17.3573 0 20.614 3.2938 21.688 8.72507L17.7384 8.93531C17.0801 5.53639 15.0014 3.469 11.2597 3.469C6.79048 3.469 3.88028 7.11321 3.88028 13.035C3.88028 18.9919 6.82513 22.531 11.2251 22.531C15.2093 22.531 17.3227 20.2534 17.9116 16.5391L21.8612 16.7493C20.9258 22.3908 17.288 26 11.2251 26Z" fill="white"/>
              <path d="M33.5288 25.8598C28.1934 25.8598 24.7982 22.0054 24.7982 16.1186C24.7982 10.2318 28.1934 6.37736 33.4249 6.37736C38.4485 6.37736 41.8783 9.98652 41.8783 16.2588V17.2049H28.6438C28.8171 20.8491 30.6533 22.6712 33.5635 22.6712C35.7461 22.6712 37.2012 21.5849 37.7902 19.8329L41.6012 20.0782C40.6311 23.5472 37.617 25.8598 33.5288 25.8598ZM28.6438 14.4016H37.9634C37.7556 11.1078 35.954 9.531 33.4249 9.531C30.8265 9.531 29.0596 11.248 28.6438 14.4016Z" fill="white"/>
              <path d="M49.8527 25.4394C47.4276 25.4394 45.8339 24.248 45.8339 21.4798V0.560646H49.5063V21.1294C49.5063 22.0054 49.9567 22.3908 50.7882 22.3908H52.2433V25.4394H49.8527Z" fill="white"/>
              <path d="M63.5052 25.8598C58.1698 25.8598 54.7745 22.0054 54.7745 16.1186C54.7745 10.2318 58.1698 6.37736 63.4012 6.37736C68.4248 6.37736 71.8547 9.98652 71.8547 16.2588V17.2049H58.6202C58.7934 20.8491 60.6296 22.6712 63.5398 22.6712C65.7225 22.6712 67.1776 21.5849 67.7665 19.8329L71.5775 20.0782C70.6074 23.5472 67.5933 25.8598 63.5052 25.8598ZM58.6202 14.4016H67.9398C67.7319 11.1078 65.9303 9.531 63.4012 9.531C60.8028 9.531 59.0359 11.248 58.6202 14.4016Z" fill="white"/>
              <path d="M84.5514 25.8598C81.9876 25.8598 79.9435 24.6685 78.9042 22.6361L78.8003 25.4394H75.3704V0.560646H79.0428V9.42588C79.9782 7.81402 81.9876 6.37736 84.5514 6.37736C89.3671 6.37736 92.3812 10.1617 92.3812 16.1186C92.3812 22.0755 89.3671 25.8598 84.5514 25.8598ZM83.9624 22.6361C86.7687 22.6361 88.5702 20.1482 88.5702 16.1186C88.5702 12.0189 86.8033 9.60108 83.9971 9.60108C80.879 9.60108 79.0428 12.0189 79.0428 16.1186C79.0428 20.1482 80.879 22.6361 83.9624 22.6361Z" fill="white"/>
              <path d="M96.5154 25.4394V0.560646H113.492V5.04582H101.781V11.0728H112.868V15.4879H101.781V25.4394H96.5154Z" fill="#FF5500"/>
              <path d="M117.424 25.4394V0.560646H122.69V25.4394H117.424Z" fill="#FF5500"/>
              <path d="M133.354 25.4394V5.04582H126.01V0.560646H146V5.04582H138.655V25.4394H133.354Z" fill="#FF5500"/>
            </svg>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile hamburger menu */}
            <div className="md:hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-6">
              <span className="text-white text-sm">Log In</span>
              <button className="bg-white text-black px-8 py-4 rounded-full text-sm font-medium">
                Get started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-4 md:px-6 lg:px-40">
          <div className="glass-card rounded-3xl p-6 md:p-14 max-w-xl mt-12 md:mt-24">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-4 md:mb-6 uppercase">
              TRAIN WITH YOUR IDOL.{" "}
              <span className="text-orange-500">LIVE</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-8 md:mb-12 leading-relaxed">
              Be part of the world&apos;s first live celebrity training experience. Limited sports. No reruns
            </p>
            
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg text-sm"
                />
                <button className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap">
                  Join Waitlist
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm text-center">
              First live sessions drops soon. Reserve your spot now.
            </p>
          </div>
        </div>
      </section>

      {/* What is CelebFIT Section */}
      <section className="px-4 md:px-6 lg:px-56 py-12 md:py-24">
        <div className="text-center mb-8 md:mb-16">
          <h3 className="text-sm md:text-base text-white uppercase tracking-widest mb-4">WHAT IS CELEBFIT?</h3>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 uppercase">
            TRAIN WITH THE PEOPLE WHO INSPIRE YOU. IN REAL TIME
          </h2>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-6 lg:px-56 pb-12 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {/* Feature 1 - Live Workouts */}
          <div className="relative group">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/3addd86bb18b972972857cdcbe4c48b756c3d6c9?width=800"
                alt="Live workouts"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  LIVE WORKOUTS
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  ON LIVE SESSIONS DOING ALL KIND OF EXERCISES
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 - Live. Then Gone */}
          <div className="relative group">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/656ca994e2de4f472bb4e951d1266a5a7c041478?width=800"
                alt="Live workout session"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  LIVE. THEN GONE.
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  NO REPLAYS. NO RERUNS. SHOW UP OR MISS OUT
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 - Ask Questions */}
          <div className="relative group md:col-span-2 lg:col-span-1">
            <div className="relative h-[300px] md:h-[507px] rounded-lg overflow-hidden">
              <Image
                src="https://api.builder.io/api/v1/image/assets/TEMP/e6316773bf08160c15c9ade93dd16c4bd4a4d520?width=800"
                alt="Ask questions"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 card-gradient"></div>
              <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                <p className="text-orange-500 text-sm font-medium uppercase tracking-wider mb-2">
                  ASK QUESTIONS
                </p>
                <p className="text-white text-base md:text-lg font-normal uppercase tracking-wide leading-tight">
                  GET ANSWERS MID-SESSIONS AND DURING COOLDOWN
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-4 md:px-6 lg:px-40 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-start">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-100 mb-6 md:mb-8">HOW IT WORKS?</h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus
            </p>
            <button className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium">
              Join Waitlist
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Step 1 */}
            <div className="step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M4 16.2793H20" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.125 24.2793C9.31567 26.7193 12.461 28.2793 15.9997 28.2793C22.6277 28.2793 27.9997 22.906 27.9997 16.2793C27.9997 9.6513 22.6277 4.2793 15.9997 4.2793C12.461 4.2793 9.31567 5.8393 7.125 8.2793" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12.2793L4 16.2793L8 20.2793" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Sign up</h3>
                  <p className="text-gray-300 text-base md:text-lg">Join the waitlist to claim your spot before it fills.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path fillRule="evenodd" clipRule="evenodd" d="M28.0049 13.3479H27.0045C25.1628 13.3479 23.6699 14.8409 23.6699 16.6827C23.6699 17.5671 24.0212 18.4152 24.6465 19.0407C25.272 19.666 26.1201 20.0173 27.0045 20.0173H28.0049V23.3521C28.0049 24.8255 26.8105 26.0199 25.3372 26.0199H21.3356V26.6868C21.3356 28.5285 19.8425 30.0215 18.0008 30.0215C16.1591 30.0215 14.6661 28.5285 14.6661 26.6868V26.0199H10.6644C9.19106 26.0199 7.99666 24.8255 7.99666 23.3521V20.0173H7.32972C5.488 20.0173 3.995 18.5244 3.995 16.6827C3.995 14.8409 5.488 13.3479 7.32972 13.3479H7.99666V10.0132C7.99666 8.53982 9.19106 7.34542 10.6644 7.34542H14.6661V6.67847C14.6661 4.83676 16.1591 3.34375 18.0008 3.34375C19.8425 3.34375 21.3356 4.83676 21.3356 6.67847V7.34542H25.3372C26.8105 7.34542 28.0049 8.53982 28.0049 10.0132V13.3479Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Get Notified</h3>
                  <p className="text-gray-300 text-base md:text-lg">We&apos;ll email you well in advance with everything you need to join your first live session.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M17.573 14.6092C18.4414 15.4776 18.4414 16.8862 17.573 17.7546C16.7046 18.623 15.2961 18.623 14.4277 17.7546C13.5593 16.8862 13.5593 15.4776 14.4277 14.6092C15.2961 13.7396 16.7046 13.7396 17.573 14.6092Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.33008 16.1797C9.33008 15.6914 9.44212 15.2086 9.66088 14.763C10.7827 12.4675 13.2637 10.9922 15.9995 10.9922C18.7354 10.9922 21.2163 12.4675 22.3382 14.763C22.5569 15.2086 22.669 15.6914 22.669 16.1797C22.669 16.6678 22.5569 17.1508 22.3382 17.5962C21.215 19.8905 18.7341 21.3672 15.9995 21.3672C13.2637 21.3672 10.7827 19.8918 9.66088 17.5962C9.44212 17.1508 9.33008 16.6678 9.33008 16.1797Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 28.1858C22.6302 28.1858 28.005 22.811 28.005 16.1808C28.005 9.5506 22.6302 4.17578 16 4.17578C9.36982 4.17578 3.995 9.5506 3.995 16.1808C3.995 22.811 9.36982 28.1858 16 28.1858Z" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Train Live</h3>
                  <p className="text-gray-300 text-base md:text-lg">Follow along, ask questions, and sweat side-by-side with your idols... in real time.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="step-card rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M17.482 24.2402C16.5336 25.19 16.0007 26.477 16 27.8192V29.4278" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5176 24.2422C15.466 25.1919 15.9989 26.479 15.9996 27.8211V29.4298" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.0029 16.2383C18.5036 18.0164 13.4964 18.0164 8.99707 16.2383" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M25.3369 11.4219H29.3386" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M27.3377 13.4216L25.3369 11.4207L27.3377 9.41992" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.6628 11.4219H2.66113" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.66199 9.41992L6.66281 11.4207L4.66199 13.4216" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.4107 2.75L22.6104 4.9616C21.2312 8.75395 21.4724 12.9466 23.2774 16.5557C25.2403 20.483 25.3446 25.0822 23.5615 29.0944L23.4147 29.4265" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.58886 2.75L9.3892 4.9616C10.7683 8.75395 10.5271 12.9466 8.72225 16.5557C6.75925 20.483 6.65504 25.0822 8.43813 29.0944L8.58486 29.4265" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.0117 7.19727H21.9874" stroke="#F3F3F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-2">Watch your Gains</h3>
                  <p className="text-gray-300 text-base md:text-lg">Watch yourself getting jacked while observing yourself ho finally reach the fitness goals you set.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 md:px-6 lg:px-40 py-12 md:py-24">
        <div className="text-center mb-8 md:mb-16">
          <p className="text-gray-500 text-xs md:text-sm uppercase tracking-widest mb-4 md:mb-8">WANT TO KNOW MORE?</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-100">FREQUENTLY ASKED QUESTIONS</h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {/* FAQ Item 1 - Expanded */}
          <div className="faq-item rounded-2xl p-4 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg md:text-xl font-medium text-white pr-4">Lorem ipsum dolor sit amet consectetur. Id molestie?</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M7.75586 7.75781L16.2411 16.2431" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.75691 16.2431L16.2422 7.75781" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-white text-sm md:text-base leading-relaxed">
              Lorem ipsum dolor sit amet consectetur. Quis sagittis elementum sit urna. Diam tempus tincidunt in sit commodo elementum a nibh nunc. Pulvinar ut nullam porttitor pretium vulputate morbi in id feugiat. Diam tempus tincidunt in sit commodo elementum a nibh nunc. Pulvinar ut nullamOdio viverra vitae nulla.
            </p>
          </div>

          {/* FAQ Items 2-5 - Collapsed */}
          {[
            "Lorem ipsum dolor sit amet consectetur?",
            "Lorem ipsum dolor sit amet?",
            "Lorem ipsum dolor sit amet consectetur. Bibendum odio vel semper?",
            "Lorem ipsum dolor sit amet consectetur.?"
          ].map((question, index) => (
            <div key={index} className="faq-item rounded-2xl p-4 md:p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg md:text-xl font-medium text-white pr-4">{question}</h3>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M6 12H18" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V6" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-600 bg-black px-4 md:px-6 lg:px-56 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
          <div className="text-center lg:text-left">
            <svg width="142" height="28" viewBox="0 0 142 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6 mx-auto lg:mx-0">
              <path d="M10.9175 27C4.44789 27 0 22.1294 0 14.035C0 6.01078 4.3805 1 10.9512 1C16.8818 1 20.0492 4.2938 21.0938 9.72507L17.2524 9.93531C16.6122 6.53639 14.5904 4.469 10.9512 4.469C6.60444 4.469 3.77397 8.11321 3.77397 14.035C3.77397 19.9919 6.63814 23.531 10.9175 23.531C14.7926 23.531 16.8481 21.2534 17.4209 17.5391L21.2623 17.7493C20.3525 23.3908 16.8144 27 10.9175 27Z" fill="white"/>
              <path d="M32.6102 26.8598C27.421 26.8598 24.1188 23.0054 24.1188 17.1186C24.1188 11.2318 27.421 7.37736 32.5091 7.37736C37.3951 7.37736 40.731 10.9865 40.731 17.2588V18.2049H27.8591C28.0276 21.8491 29.8134 23.6712 32.6439 23.6712C34.7668 23.6712 36.182 22.5849 36.7549 20.8329L40.4614 21.0782C39.5179 24.5472 36.5864 26.8598 32.6102 26.8598ZM27.8591 15.4016H36.9233C36.7212 12.1078 34.969 10.531 32.5091 10.531C29.9819 10.531 28.2634 12.248 27.8591 15.4016Z" fill="white"/>
              <path d="M48.4869 26.4394C46.1282 26.4394 44.5781 25.248 44.5781 22.4798V1.56065H48.1499V22.1294C48.1499 23.0054 48.588 23.3908 49.3967 23.3908H50.8119V26.4394H48.4869Z" fill="white"/>
              <path d="M61.7653 26.8598C56.5761 26.8598 53.2739 23.0054 53.2739 17.1186C53.2739 11.2318 56.5761 7.37736 61.6642 7.37736C66.5501 7.37736 69.886 10.9865 69.886 17.2588V18.2049H57.0141C57.1826 21.8491 58.9685 23.6712 61.799 23.6712C63.9218 23.6712 65.3371 22.5849 65.9099 20.8329L69.6165 21.0782C68.673 24.5472 65.7414 26.8598 61.7653 26.8598ZM57.0141 15.4016H66.0784C65.8762 12.1078 64.124 10.531 61.6642 10.531C59.137 10.531 57.4185 12.248 57.0141 15.4016Z" fill="white"/>
              <path d="M82.2349 26.8598C79.7414 26.8598 77.7533 25.6685 76.7424 23.6361L76.6413 26.4394H73.3054V1.56065H76.8772V10.4259C77.787 8.81402 79.7414 7.37736 82.2349 7.37736C86.9187 7.37736 89.8502 11.1617 89.8502 17.1186C89.8502 23.0755 86.9187 26.8598 82.2349 26.8598ZM81.6621 23.6361C84.3914 23.6361 86.1436 21.1482 86.1436 17.1186C86.1436 13.0189 84.4251 10.6011 81.6958 10.6011C78.6631 10.6011 76.8772 13.0189 76.8772 17.1186C76.8772 21.1482 78.6631 23.6361 81.6621 23.6361Z" fill="white"/>
              <path d="M93.8711 26.4394V1.56065H110.382V6.04582H98.9929V12.0728H109.776V16.4879H98.9929V26.4394H93.8711Z" fill="#FF7700"/>
              <path d="M114.207 26.4394V1.56065H119.329V26.4394H114.207Z" fill="#FF7700"/>
              <path d="M129.701 26.4394V6.04582H122.557V1.56065H142V6.04582H134.856V26.4394H129.701Z" fill="#FF7700"/>
            </svg>
            <nav className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 mb-6 md:mb-8">
              <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">Waitlist</a>
              <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">Features</a>
              <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">How it works</a>
              <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">FAQs</a>
            </nav>
            <div className="flex justify-center lg:justify-start gap-4 md:gap-6 mb-6 md:mb-8">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_108_558)">
                  <path d="M12 2.16094C15.2063 2.16094 15.5859 2.175 16.8469 2.23125C18.0188 2.28281 18.6516 2.47969 19.0734 2.64375C19.6313 2.85938 20.0344 3.12188 20.4516 3.53906C20.8734 3.96094 21.1313 4.35938 21.3469 4.91719C21.5109 5.33906 21.7078 5.97656 21.7594 7.14375C21.8156 8.40937 21.8297 8.78906 21.8297 11.9906C21.8297 15.1969 21.8156 15.5766 21.7594 16.8375C21.7078 18.0094 21.5109 18.6422 21.3469 19.0641C21.1313 19.6219 20.8687 20.025 20.4516 20.4422C20.0297 20.8641 19.6313 21.1219 19.0734 21.3375C18.6516 21.5016 18.0141 21.6984 16.8469 21.75C15.5813 21.8062 15.2016 21.8203 12 21.8203C8.79375 21.8203 8.41406 21.8062 7.15313 21.75C5.98125 21.6984 5.34844 21.5016 4.92656 21.3375C4.36875 21.1219 3.96563 20.8594 3.54844 20.4422C3.12656 20.0203 2.86875 19.6219 2.65313 19.0641C2.48906 18.6422 2.29219 18.0047 2.24063 16.8375C2.18438 15.5719 2.17031 15.1922 2.17031 11.9906C2.17031 8.78438 2.18438 8.40469 2.24063 7.14375C2.29219 5.97187 2.48906 5.33906 2.65313 4.91719C2.86875 4.35938 3.13125 3.95625 3.54844 3.53906C3.97031 3.11719 4.36875 2.85938 4.92656 2.64375C5.34844 2.47969 5.98594 2.28281 7.15313 2.23125C8.41406 2.175 8.79375 2.16094 12 2.16094ZM12 0C8.74219 0 8.33438 0.0140625 7.05469 0.0703125C5.77969 0.126563 4.90313 0.332812 4.14375 0.628125C3.35156 0.9375 2.68125 1.34531 2.01563 2.01562C1.34531 2.68125 0.9375 3.35156 0.628125 4.13906C0.332812 4.90313 0.126563 5.775 0.0703125 7.05C0.0140625 8.33437 0 8.74219 0 12C0 15.2578 0.0140625 15.6656 0.0703125 16.9453C0.126563 18.2203 0.332812 19.0969 0.628125 19.8563C0.9375 20.6484 1.34531 21.3188 2.01563 21.9844C2.68125 22.65 3.35156 23.0625 4.13906 23.3672C4.90313 23.6625 5.775 23.8687 7.05 23.925C8.32969 23.9812 8.7375 23.9953 11.9953 23.9953C15.2531 23.9953 15.6609 23.9812 16.9406 23.925C18.2156 23.8687 19.0922 23.6625 19.8516 23.3672C20.6391 23.0625 21.3094 22.65 21.975 21.9844C22.6406 21.3188 23.0531 20.6484 23.3578 19.8609C23.6531 19.0969 23.8594 18.225 23.9156 16.95C23.9719 15.6703 23.9859 15.2625 23.9859 12.0047C23.9859 8.74688 23.9719 8.33906 23.9156 7.05938C23.8594 5.78438 23.6531 4.90781 23.3578 4.14844C23.0625 3.35156 22.6547 2.68125 21.9844 2.01562C21.3188 1.35 20.6484 0.9375 19.8609 0.632812C19.0969 0.3375 18.225 0.13125 16.95 0.075C15.6656 0.0140625 15.2578 0 12 0Z" fill="white"/>
                  <path d="M12 5.83594C8.59688 5.83594 5.83594 8.59688 5.83594 12C5.83594 15.4031 8.59688 18.1641 12 18.1641C15.4031 18.1641 18.1641 15.4031 18.1641 12C18.1641 8.59688 15.4031 5.83594 12 5.83594ZM12 15.9984C9.79219 15.9984 8.00156 14.2078 8.00156 12C8.00156 9.79219 9.79219 8.00156 12 8.00156C14.2078 8.00156 15.9984 9.79219 15.9984 12C15.9984 14.2078 14.2078 15.9984 12 15.9984Z" fill="white"/>
                  <path d="M19.8469 5.59141C19.8469 6.38828 19.2 7.03047 18.4078 7.03047C17.6109 7.03047 16.9688 6.3836 16.9688 5.59141C16.9688 4.79453 17.6156 4.15234 18.4078 4.15234C19.2 4.15234 19.8469 4.79922 19.8469 5.59141Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="clip0_108_558">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_108_557)">
                  <path d="M22.2234 0H1.77187C0.792187 0 0 0.773438 0 1.72969V22.2656C0 23.2219 0.792187 24 1.77187 24H22.2234C23.2031 24 24 23.2219 24 22.2703V1.72969C24 0.773438 23.2031 0 22.2234 0ZM7.12031 20.4516H3.55781V8.99531H7.12031V20.4516ZM5.33906 7.43438C4.19531 7.43438 3.27188 6.51094 3.27188 5.37187C3.27188 4.23281 4.19531 3.30937 5.33906 3.30937C6.47813 3.30937 7.40156 4.23281 7.40156 5.37187C7.40156 6.50625 6.47813 7.43438 5.33906 7.43438ZM20.4516 20.4516H16.8937V14.8828C16.8937 13.5562 16.8703 11.8453 15.0422 11.8453C13.1906 11.8453 12.9094 13.2937 12.9094 14.7891V20.4516H9.35625V8.99531H12.7687V10.5609H12.8156C13.2891 9.66094 14.4516 8.70938 16.1813 8.70938C19.7859 8.70938 20.4516 11.0813 20.4516 14.1656V20.4516Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="clip0_108_557">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_108_560)">
                  <path d="M23.9681 23.5741L14.5868 9.89729L14.6028 9.91009L23.0614 0.107422H20.2348L13.3441 8.08609L7.87209 0.107422H0.45876L9.21716 12.8765L9.21609 12.8754L-0.0212402 23.5741H2.80543L10.4662 14.6973L16.5548 23.5741H23.9681ZM6.75209 2.24076L19.9148 21.4408H17.6748L4.50143 2.24076H6.75209Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="clip0_108_560">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 24L1.687 17.837C0.645998 16.033 0.0989998 13.988 0.0999998 11.891C0.103 5.335 5.43799 0 11.993 0C15.174 0.001 18.16 1.24 20.406 3.488C22.6509 5.736 23.8869 8.724 23.8859 11.902C23.8829 18.459 18.548 23.794 11.993 23.794C10.003 23.793 8.04198 23.294 6.30499 22.346L0 24ZM6.59698 20.193C8.27298 21.188 9.87298 21.784 11.989 21.785C17.437 21.785 21.875 17.351 21.878 11.9C21.88 6.438 17.463 2.01 11.997 2.008C6.54498 2.008 2.11 6.442 2.108 11.892C2.107 14.117 2.75899 15.783 3.85399 17.526L2.85499 21.174L6.59698 20.193ZM17.984 14.729C17.91 14.605 17.712 14.531 17.414 14.382C17.117 14.233 15.656 13.514 15.383 13.415C15.111 13.316 14.913 13.266 14.714 13.564C14.516 13.861 13.946 14.531 13.773 14.729C13.6 14.927 13.426 14.952 13.129 14.803C12.832 14.654 11.874 14.341 10.739 13.328C9.85598 12.54 9.25898 11.567 9.08598 11.269C8.91298 10.972 9.06798 10.811 9.21598 10.663C9.34998 10.53 9.51298 10.316 9.66198 10.142C9.81298 9.97 9.86198 9.846 9.96198 9.647C10.061 9.449 10.012 9.275 9.93698 9.126C9.86198 8.978 9.26798 7.515 9.02098 6.92C8.77898 6.341 8.53398 6.419 8.35198 6.41L7.78198 6.4C7.58398 6.4 7.26198 6.474 6.98998 6.772C6.71798 7.07 5.94999 7.788 5.94999 9.251C5.94999 10.714 7.01498 12.127 7.16298 12.325C7.31198 12.523 9.25798 15.525 12.239 16.812C12.948 17.118 13.502 17.301 13.933 17.438C14.645 17.664 15.293 17.632 15.805 17.556C16.376 17.471 17.563 16.837 17.811 16.143C18.059 15.448 18.059 14.853 17.984 14.729Z" fill="white"/>
              </svg>
            </div>
            <p className="text-white text-sm md:text-base">© CelebFit 2025</p>
          </div>
          <div className="flex justify-center lg:justify-end gap-4 md:gap-8 mt-4 lg:mt-0">
            <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">Privacy Policy</a>
            <a href="#" className="text-gray-300 hover:text-white text-sm md:text-base">Terms Of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
