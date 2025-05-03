import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Dumbbell,
  Heart,
  BookOpen,
  Video,
  Coffee,
  FileText,
  Award,
} from "lucide-react";
import { StreamerGuideModalProps } from "@/lib/types/ui";

export function StreamerGuideModal({
  open,
  onOpenChange,
}: StreamerGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Celebrity Fitness Streamer Guide
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="getting-started" className="w-full mt-4">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="fitness-content">Fitness Content</TabsTrigger>
            <TabsTrigger value="tech-setup">Tech Setup</TabsTrigger>
            <TabsTrigger value="monetization">Monetization</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Video className="h-5 w-5 mr-2 text-brandOrange" />
                Welcome to CelebFitLife
              </h3>
              <p className="text-sm mb-4">
                As a celebrity fitness expert, your knowledge and influence can
                help millions of people achieve their fitness goals. This guide
                will help you get started with livestreaming your workouts,
                nutrition tips, and wellness advice.
              </p>

              <h4 className="font-medium mt-4 mb-2">Quick Start Checklist:</h4>
              <ul className="space-y-2">
                {[
                  "Complete your profile with professional photos and bio",
                  "Set up your streaming equipment (camera, microphone, lighting)",
                  "Plan your first 3-5 streams with specific themes",
                  "Promote your upcoming streams on your social channels",
                  "Test your setup with a private stream before going live",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-brandBlack dark:bg-brandOrange/30 p-3 rounded-md mt-4">
                <p className="text-sm font-medium text-brandOrange dark:text-brandOrange">
                  Celebrity Success Tip: Consistency is key! Viewers are 3x more
                  likely to follow streamers with a regular schedule.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Platform Benefits
                </h4>
                <ul className="mt-2 space-y-1">
                  {[
                    "Verified profile badge",
                    "Priority support team",
                    "Analytics dashboard",
                    "Custom branding options",
                    "Multi-platform streaming",
                  ].map((item, i) => (
                    <li key={i} className="text-sm flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium flex items-center">
                  <Coffee className="h-5 w-5 mr-2 text-orange-500" />
                  Community Guidelines
                </h4>
                <ul className="mt-2 space-y-1">
                  {[
                    "Be authentic and professional",
                    "Respect viewer privacy and questions",
                    "Provide evidence-based fitness advice",
                    "Disclose sponsorships and partnerships",
                    "Maintain a positive, inclusive environment",
                  ].map((item, i) => (
                    <li key={i} className="text-sm flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fitness-content" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-blue-500" />
                Content Ideas for Celebrity Fitness Streamers
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-600 dark:text-blue-400">
                    Workout Streams
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Celebrity-inspired HIIT workouts",
                      "Red carpet ready in 30 days",
                      "On-set fitness routines",
                      "Travel-friendly hotel room workouts",
                      "Recovery sessions for busy schedules",
                      "Partner workouts with celebrity guests",
                    ].map((item, i) => (
                      <li key={i} className="text-sm flex items-start">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-green-600 dark:text-green-400">
                    Nutrition & Wellness
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "Meal prep sessions for busy days",
                      "On-set nutrition secrets revealed",
                      "Healthy recipe demonstrations",
                      "Supplement reviews and recommendations",
                      "Mindfulness and stress management",
                      "Sleep optimization techniques",
                    ].map((item, i) => (
                      <li key={i} className="text-sm flex items-start">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-brandOrange dark:text-brandOrange">
                  Interactive Stream Ideas
                </h4>
                <div className="grid sm:grid-cols-3 gap-3 mt-2">
                  {[
                    {
                      title: "Q&A Sessions",
                      desc: "Answer viewer fitness questions live",
                    },
                    {
                      title: "Transformation Stories",
                      desc: "Share before/after journeys with tips",
                    },
                    {
                      title: "Fitness Challenges",
                      desc: "Create 7-30 day viewer challenges",
                    },
                    {
                      title: "Equipment Reviews",
                      desc: "Test and review fitness products",
                    },
                    {
                      title: "Training Consultations",
                      desc: "Form checks and personalized advice",
                    },
                    {
                      title: "Behind-the-Scenes",
                      desc: "Show celebrity training preparation",
                    },
                  ].map((item, i) => (
                    <div key={i} className="border rounded-md p-3">
                      <h5 className="font-medium text-sm">{item.title}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md mt-6">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  <Heart className="h-4 w-4 inline mr-1" /> Pro Tip: Mix
                  exclusive celebrity fitness routines with accessible
                  modifications for all viewer fitness levels.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tech-setup" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Video className="h-5 w-5 mr-2 text-brandOrange" />
                Technical Setup Guide
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Essential Equipment</h4>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      {
                        title: "Camera",
                        specs: "Recommended: 1080p minimum, 4K preferred",
                        options: "DSLR, mirrorless, or high-end webcam",
                      },
                      {
                        title: "Microphone",
                        specs: "Clear audio is critical for instruction",
                        options: "Lavalier mic, boom mic, or wireless headset",
                      },
                      {
                        title: "Lighting",
                        specs: "Soft, even lighting prevents shadows",
                        options: "Ring light, softboxes, or studio lights",
                      },
                      {
                        title: "Internet",
                        specs: "10+ Mbps upload speed minimum",
                        options: "Wired connection recommended",
                      },
                      {
                        title: "Background",
                        specs: "Clean, branded, or dedicated studio space",
                        options: "Green screen or professional backdrop",
                      },
                      {
                        title: "Streaming Device",
                        specs: "Dedicated computer for streaming",
                        options: "Gaming PC or high-end laptop",
                      },
                    ].map((item, i) => (
                      <div key={i} className="border rounded-md p-3">
                        <h5 className="font-medium text-sm">{item.title}</h5>
                        <p className="text-xs mt-1">{item.specs}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.options}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Stream Quality Settings</h4>
                  <div className="bg-gray-100 dark:bg-gray-100 rounded-md p-3 font-mono text-sm">
                    <p>
                      <span className="text-brandOrange dark:text-brandOrange">
                        Resolution:
                      </span>{" "}
                      <span className="text-black">1920x1080 (1080p)</span>
                    </p>
                    <p>
                      <span className="text-brandOrange dark:text-brandOrange">
                        Bitrate:
                      </span>{" "}
                      <span className="text-black">5,000-6,000 Kbps</span>
                    </p>
                    <p>
                      <span className="text-brandOrange dark:text-brandOrange">
                        Framerate:
                      </span>{" "}
                      <span className="text-black">
                        60fps for movement clarity
                      </span>
                    </p>
                    <p>
                      <span className="text-brandOrange dark:text-brandOrange">
                        Keyframe:
                      </span>{" "}
                      <span className="text-black">2 seconds</span>
                    </p>
                    <p>
                      <span className="text-brandOrange dark:text-brandOrange">
                        Audio:
                      </span>{" "}
                      <span className="text-black">160 Kbps, 48kHz stereo</span>
                    </p>
                  </div>
                </div>

                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md mt-4">
                  <h5 className="font-medium text-sm text-red-800 dark:text-red-300">
                    Before Going Live Checklist:
                  </h5>
                  <ul className="mt-1 space-y-1">
                    {[
                      "Test your internet connection speed",
                      "Check camera focus and positioning",
                      "Test microphone audio levels",
                      "Ensure proper lighting with no harsh shadows",
                      "Remove background distractions",
                      "Do a short test recording to review quality",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-red-800 dark:text-red-300 flex items-start"
                      >
                        <Check className="h-3 w-3 mt-0.5 mr-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monetization" className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-500" />
                Monetization Strategies for Celebrity Fitness Streamers
              </h3>

              <div className="grid sm:grid-cols-2 gap-6 mt-4">
                <div>
                  <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                    Platform Revenue
                  </h4>
                  <ul className="space-y-3">
                    {[
                      {
                        title: "Subscriber Revenue",
                        desc: "Monthly recurring income from subscribers",
                      },
                      {
                        title: "Virtual Tips & Donations",
                        desc: "One-time contributions during streams",
                      },
                      {
                        title: "Ad Revenue Sharing",
                        desc: "Percentage of advertising income",
                      },
                      {
                        title: "Premium Content",
                        desc: "Exclusive workouts for paying members",
                      },
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">
                            {i + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">{item.title}</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                    External Opportunities
                  </h4>
                  <ul className="space-y-3">
                    {[
                      {
                        title: "Brand Partnerships",
                        desc: "Sponsored content with fitness brands",
                      },
                      {
                        title: "Fitness Product Lines",
                        desc: "Develop your own equipment or apparel",
                      },
                      {
                        title: "Digital Products",
                        desc: "Workout programs, meal plans, e-books",
                      },
                      {
                        title: "Training Workshops",
                        desc: "Premium virtual training sessions",
                      },
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                            {i + 1}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">{item.title}</h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-100 dark:bg-yellow-100 p-4 rounded-md mt-6">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-800 mb-2">
                  Celebrity Advantage
                </h4>
                <p className="text-sm text-black">
                  Your celebrity status opens unique monetization opportunities:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-black">
                  {[
                    "Higher subscription tier potential than regular streamers",
                    "Premium brand partnership opportunities",
                    "Cross-promotion with entertainment projects",
                    "Exclusive celebrity fitness collaborations",
                    "Media appearances as a fitness expert",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="h-5 w-5 flex items-center justify-center mr-2 flex-shrink-0 text-black">
                        ★
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Close Guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
