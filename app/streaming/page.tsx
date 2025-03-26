"use client";
import { Search, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import React from 'react';

const streamers = [
  {
    name: 'Alex Fitness',
    quote: '&ldquo;Let&rsquo;s get burning guys!&rdquo;',
    tags: ['Legs', 'Arms', 'Back'],
    followers: 15400,
    specialty: 'HIIT',
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Emma Strength',
    quote: '&ldquo;Fitness is a lifestyle!&rdquo;',
    tags: ['Cardio', 'Core', 'Arms'],
    followers: 22100,
    specialty: 'Pilates',
    imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    name: 'Jake Power',
    quote: '&ldquo;Push your limits!&rdquo;',
    tags: ['Legs', 'Back', 'Strength'],
    followers: 18750,
    specialty: 'Bodybuilding',
    imageUrl: 'https://randomuser.me/api/portraits/men/85.jpg'
  }
];

const discoverStreamers = [
  {
    name: 'Sarah Flex',
    quote: '&ldquo;Transform your body, transform your life!&rdquo;',
    tags: ['Yoga', 'Pilates', 'Core'],
    followers: 12500,
    specialty: 'Flexibility',
    imageUrl: 'https://randomuser.me/api/portraits/women/65.jpg'
  },
  {
    name: 'Mike Muscle',
    quote: '&ldquo;Strength is a skill!&rdquo;',
    tags: ['Strength', 'Weightlifting', 'Arms'],
    followers: 19800,
    specialty: 'Bodybuilding',
    imageUrl: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    name: 'Lisa Cardio',
    quote: '&ldquo;Every step counts!&rdquo;',
    tags: ['Cardio', 'Running', 'HIIT'],
    followers: 16700,
    specialty: 'Endurance',
    imageUrl: 'https://randomuser.me/api/portraits/women/79.jpg'
  },
  {
    name: 'Tom Core',
    quote: '&ldquo;Core is the foundation!&rdquo;',
    tags: ['Core', 'Abs', 'Stability'],
    followers: 14300,
    specialty: 'Core Training',
    imageUrl: 'https://randomuser.me/api/portraits/men/44.jpg'
  },
  {
    name: 'Elena Balance',
    quote: '&ldquo;Find your balance!&rdquo;',
    tags: ['Yoga', 'Balance', 'Meditation'],
    followers: 11900,
    specialty: 'Mind-Body',
    imageUrl: 'https://randomuser.me/api/portraits/women/33.jpg'
  },
  {
    name: 'Carlos Power',
    quote: '&ldquo;Push beyond limits!&rdquo;',
    tags: ['Strength', 'CrossFit', 'Conditioning'],
    followers: 20500,
    specialty: 'Performance',
    imageUrl: 'https://randomuser.me/api/portraits/men/67.jpg'
  }
];

const workoutCategories = [
  {
    name: 'HIIT',
    subtags: ['Cardio', 'Full Body', 'Interval Training'],
    description: 'High-Intensity Interval Training for maximum calorie burn'
  },
  {
    name: 'Bodybuilding',
    subtags: ['Muscle Growth', 'Strength', 'Weight Training', 'Legs', 'Arms', 'Back', 'Chest'],
    description: 'Focused muscle development and strength training'
  },
  {
    name: 'Yoga',
    subtags: ['Flexibility', 'Core', 'Meditation', 'Power Yoga', 'Vinyasa'],
    description: 'Mind-body connection and holistic wellness'
  },
  {
    name: 'Cardio',
    subtags: ['Running', 'Cycling', 'Swimming', 'Dance Fitness', 'Endurance'],
    description: 'Cardiovascular health and stamina improvement'
  },
  {
    name: 'Pilates',
    subtags: ['Core Strength', 'Flexibility', 'Rehabilitation', 'Mat Pilates'],
    description: 'Low-impact exercise focusing on core strength'
  }
];

export default function UserDashboard() {
  const [visibleDiscoverStreamers, setVisibleDiscoverStreamers] = React.useState(3);
  const [isTagsOpen, setIsTagsOpen] = React.useState(false);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const loadMoreStreamers = () => {
    setVisibleDiscoverStreamers(prev => 
      Math.min(prev + 3, discoverStreamers.length)
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite font-inter">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-brandBlack border-b border-brandOrange/30">
        <div className="w-10 md:w-1/4"></div>
        
        <div className="relative w-full max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="Search streamers, workouts, tags..." 
            className="w-full px-3 py-2 md:px-4 md:py-2 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-full focus:outline-none focus:ring-2 focus:ring-brandOrange text-sm md:text-base"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brandOrange w-4 h-4 md:w-5 md:h-5" />
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4 justify-end w-10 md:w-1/4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col p-4 md:p-6 space-y-6">
        {/* Streamers and Tags Container */}
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Streamers Section */}
          <section className="w-full md:w-3/4 space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-brandWhite">MY STREAMERS</h2>
            <Slider {...settings}>
              {streamers.map((streamer, index) => (
                <div 
                  key={index} 
                  className="p-2 md:p-4 transform transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-brandBlack border border-brandOrange/30 p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl">
                    <div className="flex items-center mb-4 space-x-3 md:space-x-4">
                      <div 
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
                        style={{ backgroundImage: `url(${streamer.imageUrl})` }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base md:text-lg font-bold text-brandWhite">{streamer.name}</h3>
                          <span className="bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
                            {streamer.specialty}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-brandOrange/70">
                          {streamer.followers.toLocaleString()} Followers
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs md:text-sm text-brandWhite/70 italic mb-4">&ldquo;{streamer.quote}&rdquo;</p>
                    
                    <div className="flex space-x-2 overflow-x-auto pb-1">
                      {streamer.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="flex-shrink-0 bg-brandBlack border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </section>

          {/* Tags Sidebar */}
          <aside className="w-full md:w-1/5 bg-brandBlack border border-brandOrange/30 rounded-xl">
            <div 
              className="flex justify-between items-center p-3 cursor-pointer md:cursor-default"
              onClick={() => setIsTagsOpen(!isTagsOpen)}
            >
              <h2 className="text-base md:text-lg font-bold text-brandWhite">CATEGORIES</h2>
              <div className="md:hidden">
                {isTagsOpen ? <ChevronUp className="text-brandOrange w-4 h-4" /> : <ChevronDown className="text-brandOrange w-4 h-4" />}
              </div>
            </div>
            
            <div className={`
              ${isTagsOpen ? 'block' : 'hidden'} 
              md:block 
              space-y-1 p-2 pt-0
            `}>
              {workoutCategories.map((category) => (
                <div key={category.name} className="mb-1">
                  <div 
                    className="flex justify-between items-center bg-brandBlack border border-brandOrange/30 p-2 rounded-lg hover:bg-brandOrange/10 transition-colors cursor-pointer"
                    onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-semibold text-brandWhite">{category.name}</span>
                    </div>
                    <ChevronRight 
                      className={`text-brandOrange transform transition-transform ${
                        expandedCategory === category.name ? 'rotate-90' : ''
                      }`} 
                      size={14} 
                    />
                  </div>
                  
                  {expandedCategory === category.name && (
                    <div className="grid grid-cols-2 gap-1 mt-1 pl-1">
                      {category.subtags.map((subtag) => (
                        <button 
                          key={subtag}
                          className="bg-brandBlack border border-brandOrange/30 text-[10px] p-1 rounded-lg text-brandWhite hover:bg-brandOrange/20 transition-colors"
                        >
                          {subtag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Discover Section */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-brandWhite">DISCOVER</h2>
          <p className="text-xs md:text-sm text-brandOrange/70">What fits your needs from your previous tags?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {discoverStreamers.slice(0, visibleDiscoverStreamers).map((streamer, index) => (
              <div 
                key={index} 
                className="transform transition-all duration-300 hover:scale-105"
              >
                <div className="bg-brandBlack border border-brandOrange/30 p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl">
                  <div className="flex items-center mb-4 space-x-3 md:space-x-4">
                    <div 
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
                      style={{ backgroundImage: `url(${streamer.imageUrl})` }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base md:text-lg font-bold text-brandWhite">{streamer.name}</h3>
                        <span className="bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
                          {streamer.specialty}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-brandOrange/70">
                        {streamer.followers.toLocaleString()} Followers
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs md:text-sm text-brandWhite/70 italic mb-4">&ldquo;{streamer.quote}&rdquo;</p>
                  
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {streamer.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex} 
                        className="flex-shrink-0 bg-brandBlack border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {visibleDiscoverStreamers < discoverStreamers.length && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={loadMoreStreamers}
                className="bg-brandOrange text-brandBlack px-6 py-2 rounded-full hover:opacity-80 transition-opacity text-sm md:text-base"
              >
                Load More
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
