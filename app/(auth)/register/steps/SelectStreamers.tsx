import { useSignupStore } from '@/store/useSignupStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SelectStreamers() {
  const { userData } = useSignupStore();
  const maxSelectable = userData.plan.maxStreamers;
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div>
      <h2 className="text-xl text-brandWhite mb-4">Choose Your Streamers</h2>
      <Button className="bg-brandOrange">Finish Signup</Button>
    </div>
  );
}
