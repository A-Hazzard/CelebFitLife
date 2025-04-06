import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  User,
  Shield,
  CreditCard,
  HelpCircle,
  Video,
  WifiOff,
  VideoOff,
  MicOff,
  Layers,
  Sliders,
  Cog,
} from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Cog className="mr-2 h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full mt-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger
              value="account"
              className="flex flex-col items-center py-2"
            >
              <User className="h-4 w-4 mb-1" />
              <span className="text-xs">Account</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex flex-col items-center py-2"
            >
              <Bell className="h-4 w-4 mb-1" />
              <span className="text-xs">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="stream"
              className="flex flex-col items-center py-2"
            >
              <Video className="h-4 w-4 mb-1" />
              <span className="text-xs">Stream</span>
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="flex flex-col items-center py-2"
            >
              <CreditCard className="h-4 w-4 mb-1" />
              <span className="text-xs">Billing</span>
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="flex flex-col items-center py-2"
            >
              <Shield className="h-4 w-4 mb-1" />
              <span className="text-xs">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue="celebrityfitness" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="contact@celebrityfitness.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="america-los_angeles">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-los_angeles">
                      America/Los Angeles
                    </SelectItem>
                    <SelectItem value="america-new_york">
                      America/New York
                    </SelectItem>
                    <SelectItem value="europe-london">Europe/London</SelectItem>
                    <SelectItem value="asia-tokyo">Asia/Tokyo</SelectItem>
                    <SelectItem value="australia-sydney">
                      Australia/Sydney
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background text-black dark:text-white"
                  defaultValue="Celebrity fitness expert sharing workout tips and nutrition advice."
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive email about your account activity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Stream start alerts</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get notified when your followed streamers go live
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Comment notifications</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive alerts when someone comments on your content
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Marketing emails</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive product updates and promotional content
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stream" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quality">Stream quality</Label>
                <Select defaultValue="high">
                  <SelectTrigger id="quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (480p)</SelectItem>
                    <SelectItem value="medium">Medium (720p)</SelectItem>
                    <SelectItem value="high">High (1080p)</SelectItem>
                    <SelectItem value="ultra">Ultra (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                <Input id="bitrate" type="number" defaultValue="5000" />
              </div>

              <h4 className="font-medium mt-6">Low bandwidth mode</h4>
              <div className="flex items-center space-x-2">
                <Switch id="lowbandwidth" />
                <Label htmlFor="lowbandwidth" className="font-normal">
                  <WifiOff className="h-4 w-4 mr-2 inline-block" />
                  Enable automatic quality reduction on poor connections
                </Label>
              </div>

              <h4 className="font-medium mt-6">Default stream settings</h4>
              <div className="flex items-center space-x-2">
                <Switch id="cam" defaultChecked />
                <Label htmlFor="cam" className="font-normal">
                  <VideoOff className="h-4 w-4 mr-2 inline-block" />
                  Camera turned on by default
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="mic" defaultChecked />
                <Label htmlFor="mic" className="font-normal">
                  <MicOff className="h-4 w-4 mr-2 inline-block" />
                  Microphone turned on by default
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="chat" defaultChecked />
                <Label htmlFor="chat" className="font-normal">
                  <Layers className="h-4 w-4 mr-2 inline-block" />
                  Show chat overlay during streams
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="filters" />
                <Label htmlFor="filters" className="font-normal">
                  <Sliders className="h-4 w-4 mr-2 inline-block" />
                  Apply beauty filter automatically
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-4">
            <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Pro Plan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your subscription renews on October 15, 2023
                  </p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                  Active
                </span>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-black dark:text-white"
                >
                  View Invoice History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 text-black dark:text-white"
                >
                  Update Payment Method
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Payment Method</h3>
              <div className="flex items-center p-3 border rounded-md">
                <div className="h-8 w-12 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center mr-3">
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    VISA
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Visa ending in 4242</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Expires 12/24
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Profile visibility</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow others to find and view your profile
                  </p>
                </div>
                <Select defaultValue="public">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="followers">Followers only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Stream chat</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Who can send you messages during streams
                  </p>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="followers">Followers only</SelectItem>
                    <SelectItem value="subs">Subscribers only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Data collection</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow usage data collection to improve our service
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-factor authentication</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enhance account security with 2FA
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-black dark:text-white"
                >
                  Enable
                </Button>
              </div>

              <div className="pt-4">
                <Button variant="destructive" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-black dark:text-white"
          >
            Cancel
          </Button>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
