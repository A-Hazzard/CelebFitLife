"use client";

import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";

export default function SelectStreamers() {
  const { userData } = useSignupStore();
  const maxSelectable = userData.plan?.maxStreamers || 1;
  // const [selectedStreamers, setSelectedStreamers] = useState<string[]>([]);

  // const handleStreamerSelect = (streamerId: string) => {
  //   if (selectedStreamers.includes(streamerId)) {
  //     setSelectedStreamers((prev) => prev.filter((id) => id !== streamerId));
  //   } else if (selectedStreamers.length < maxSelectable) {
  //     setSelectedStreamers((prev) => [...prev, streamerId]);
  //   }
  // };

  return (
    <div>
      <h2 className="text-xl text-brandWhite mb-4">Choose Your Streamers</h2>
      <p className="text-sm text-brandGray mb-4">
        Select up to {maxSelectable} streamer{maxSelectable > 1 ? "s" : ""}
      </p>
      <Button className="bg-brandOrange">Finish Signup</Button>
    </div>
  );
}
