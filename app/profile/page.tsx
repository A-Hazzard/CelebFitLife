"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Settings,
  MessageSquare,
  ChevronRight,
  Calendar,
  CreditCard,
  Star,
  Crown,
  Heart,
  Share,
  UserPlus,
  Filter,
  Search,
  ChevronLeft,
  Lock,
  Edit2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Custom debounce function
function debounce<T extends (...args: string[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Create a custom hook for profile updates
const useProfileUpdate = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  // Add debounce to prevent too many API calls
  const debouncedCheckUsername = useCallback((username: string) => {
    // Move checkUsername inside the useCallback
    const checkUsernameInner = async (username: string) => {
      if (!username) {
        return;
      }

      setUsernameChecking(true);
      setUsernameAvailable(null);

      try {
        // Make the actual API call to check username availability
        const response = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        // Check if the response indicates success
        if (response.ok) {
          // The username is available if it doesn't exist in the database
          setUsernameAvailable(!data.exists);

          if (data.error) {
            toast.error(data.error);
          }
        } else {
          // If the response is not ok, show the error message
          throw new Error(data.message || "Failed to check username");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        toast.error("Failed to check username availability. Please try again.");
        // Keep the previous availability state on error
      } finally {
        setUsernameChecking(false);
      }
    };

    // Apply debounce to the inner function
    debounce(checkUsernameInner, 500)(username);
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase(); // Normalize username
    setNewUsername(value);

    if (value.length >= 3) {
      debouncedCheckUsername(value);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleProfileUpdate = async () => {
    if (!currentPassword) {
      toast.error("Current password is required!");
      return false;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords don't match!");
      return false;
    }

    if (newUsername && !usernameAvailable) {
      toast.error("Username is not available!");
      return false;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      // Reset form
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
      setConfirmPassword("");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newUsername,
    setNewUsername,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdating,
    usernameChecking,
    usernameAvailable,
    handleUsernameChange,
    handleProfileUpdate,
  };
};

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [autoRenew, setAutoRenew] = useState(true);
  const [date, setDate] = useState<Date>();
  const [postFilter, setPostFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);

  const {
    currentPassword,
    setCurrentPassword,
    newUsername,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdating,
    usernameChecking,
    usernameAvailable,
    handleUsernameChange,
    handleProfileUpdate,
  } = useProfileUpdate();

  return (
    <div className="flex flex-col min-h-screen bg-brandBlack text-brandWhite">
      <Header />
      <Toaster richColors position="top-center" />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-xl p-6 border border-brandOrange/30 relative">
            <div className="flex items-center gap-6">
              <Image
                src="/images/default-avatar.png"
                alt={currentUser?.username || "User"}
                width={120}
                height={120}
                className="rounded-full border-4 border-brandOrange"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {currentUser?.username}
                </h1>
                <p className="text-gray-400 mb-4">@{currentUser?.username}</p>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brandOrange">
                      24
                    </div>
                    <div className="text-sm text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brandOrange">
                      156
                    </div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brandOrange">
                      89
                    </div>
                    <div className="text-sm text-gray-400">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-6 right-6"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl">
                    Profile Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current-password" className="text-white">
                        Current Password
                      </Label>
                      <div className="relative">
                        <input
                          type="password"
                          id="current-password"
                          className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-username" className="text-white">
                        New Username
                      </Label>
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <input
                          type="text"
                          id="new-username"
                          className={`mt-1 w-full p-2 bg-gray-700 border rounded-md text-white ${
                            usernameAvailable === true
                              ? "border-green-500"
                              : usernameAvailable === false
                              ? "border-red-500"
                              : "border-gray-600"
                          }`}
                          value={newUsername}
                          onChange={handleUsernameChange}
                        />
                        <Edit2 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        {newUsername.length >= 3 && (
                          <motion.div
                            className="mt-1 text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {usernameChecking ? (
                              <span className="text-gray-400">
                                Checking availability...
                              </span>
                            ) : usernameAvailable === true ? (
                              <span className="text-green-500">
                                Username is available
                              </span>
                            ) : usernameAvailable === false ? (
                              <span className="text-red-500">
                                Username is already taken
                              </span>
                            ) : null}
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                    <div>
                      <Label htmlFor="new-password" className="text-white">
                        New Password
                      </Label>
                      <div className="relative">
                        <input
                          type="password"
                          id="new-password"
                          className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password" className="text-white">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <input
                          type="password"
                          id="confirm-password"
                          className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-brandOrange hover:bg-brandOrange/90"
                      onClick={async () => {
                        const success = await handleProfileUpdate();
                        if (success) setIsSettingsOpen(false);
                      }}
                      disabled={
                        isUpdating ||
                        (newUsername.length > 0 && !usernameAvailable)
                      }
                    >
                      {isUpdating ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Updating...
                        </motion.div>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Subscription Details */}
          <div className="bg-gray-800 rounded-xl p-6 border border-brandOrange/30">
            <h2 className="text-xl font-bold text-white mb-4">
              Subscription Details
            </h2>
            <div className="space-y-4">
              <Dialog
                open={isSubscriptionOpen}
                onOpenChange={setIsSubscriptionOpen}
              >
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Current Plan</h3>
                        <p className="text-sm text-gray-400">
                          Premium Membership
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl">
                      Subscription Management
                    </DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="plans" className="mt-4">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="plans">Plans</TabsTrigger>
                      <TabsTrigger value="benefits">Benefits</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plans" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedPlan === "basic"
                              ? "border-brandOrange bg-brandBlack"
                              : "border-gray-700 hover:border-gray-600"
                          )}
                          onClick={() => setSelectedPlan("basic")}
                        >
                          <h3 className="font-bold text-white">Basic</h3>
                          <p className="text-2xl font-bold text-brandOrange my-2">
                            $9.99
                            <span className="text-sm text-gray-400">
                              /month
                            </span>
                          </p>
                          <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Access to basic streams</li>
                            <li>• Limited workout content</li>
                            <li>• Standard support</li>
                          </ul>
                        </div>
                        <div
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedPlan === "premium"
                              ? "border-brandOrange bg-brandBlack"
                              : "border-gray-700 hover:border-gray-600"
                          )}
                          onClick={() => setSelectedPlan("premium")}
                        >
                          <Badge className="mb-2 bg-brandOrange">
                            Current Plan
                          </Badge>
                          <h3 className="font-bold text-white">Premium</h3>
                          <p className="text-2xl font-bold text-brandOrange my-2">
                            $19.99
                            <span className="text-sm text-gray-400">
                              /month
                            </span>
                          </p>
                          <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Access to all premium streams</li>
                            <li>• Ad-free experience</li>
                            <li>• Exclusive workout content</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                        <div
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedPlan === "pro"
                              ? "border-brandOrange bg-brandBlack"
                              : "border-gray-700 hover:border-gray-600"
                          )}
                          onClick={() => setSelectedPlan("pro")}
                        >
                          <h3 className="font-bold text-white">Pro</h3>
                          <p className="text-2xl font-bold text-brandOrange my-2">
                            $29.99
                            <span className="text-sm text-gray-400">
                              /month
                            </span>
                          </p>
                          <ul className="text-sm text-gray-300 space-y-1">
                            <li>• All Premium features</li>
                            <li>• 1-on-1 coaching sessions</li>
                            <li>• Custom workout plans</li>
                            <li>• Early access to new features</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-renew"
                            checked={autoRenew}
                            onCheckedChange={setAutoRenew}
                          />
                          <Label htmlFor="auto-renew" className="text-gray-300">
                            Auto-renew subscription
                          </Label>
                        </div>
                        <Button className="bg-brandOrange hover:bg-brandOrange/90">
                          Update Plan
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="benefits" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                Premium Benefits
                              </h4>
                              <p className="text-sm text-gray-400">
                                Your current plan includes:
                              </p>
                            </div>
                          </div>
                          <ul className="text-sm text-gray-300 space-y-2 ml-14">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-brandOrange rounded-full"></div>
                              Access to all premium streams
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-brandOrange rounded-full"></div>
                              Ad-free experience
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-brandOrange rounded-full"></div>
                              Exclusive workout content
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-brandOrange rounded-full"></div>
                              Priority support
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                              <CalendarComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                Subscription Period
                              </h4>
                              <p className="text-sm text-gray-400">
                                Manage your subscription dates
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 ml-14">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Start Date:</span>
                              <span className="text-white">Nov 1, 2024</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                Next Billing:
                              </span>
                              <span className="text-white">Dec 1, 2024</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                Billing Cycle:
                              </span>
                              <span className="text-white">Monthly</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="space-y-4">
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-white mb-2">
                            Notification Preferences
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="billing-notifications"
                                className="text-gray-300"
                              >
                                Billing Notifications
                              </Label>
                              <Switch
                                id="billing-notifications"
                                defaultChecked
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="content-updates"
                                className="text-gray-300"
                              >
                                Content Updates
                              </Label>
                              <Switch id="content-updates" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="promotional-emails"
                                className="text-gray-300"
                              >
                                Promotional Emails
                              </Label>
                              <Switch id="promotional-emails" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">
                            Payment Method
                          </h4>
                          <RadioGroup defaultValue="card" className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card" className="text-gray-300">
                                Credit Card
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="paypal" id="paypal" />
                              <Label htmlFor="paypal" className="text-gray-300">
                                PayPal
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Billing</h3>
                        <p className="text-sm text-gray-400">
                          Next payment: Dec 1, 2024
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl">
                      Billing Information
                    </DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="payment" className="mt-4">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="payment">Payment</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                      <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    </TabsList>
                    <TabsContent value="payment" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                Current Payment Method
                              </h4>
                              <p className="text-sm text-gray-400">
                                Visa ending in 4242
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-700/50 p-4 rounded-lg ml-14">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-5 bg-blue-500 rounded"></div>
                              <span className="text-white">
                                •••• •••• •••• 4242
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              Expires 12/25
                            </div>
                          </div>
                          <Button variant="outline" className="ml-14">
                            Update Payment Method
                          </Button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brandOrange rounded-full flex items-center justify-center">
                              <CalendarComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                Billing Schedule
                              </h4>
                              <p className="text-sm text-gray-400">
                                Manage your billing dates
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2 ml-14">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                Next Billing Date:
                              </span>
                              <span className="text-white">Dec 1, 2024</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">
                                Billing Cycle:
                              </span>
                              <span className="text-white">Monthly</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !date && "text-gray-400"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {date ? (
                                      format(date, "PPP")
                                    ) : (
                                      <span>Change billing date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                  style={{
                                    backgroundColor: "#1f2937",
                                    border: "1px solid #374151",
                                    borderRadius: "0.5rem",
                                    marginTop: "0.5rem",
                                  }}
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate: Date | undefined) =>
                                      setDate(newDate)
                                    }
                                    initialFocus
                                    className="rounded-md border-0"
                                    classNames={{
                                      head_cell: "text-gray-400",
                                      cell: "text-gray-300",
                                      button:
                                        "bg-gray-700 text-white hover:bg-gray-600",
                                      nav_button: "text-gray-400",
                                      nav_button_previous: "ml-2",
                                      nav_button_next: "mr-2",
                                      selected:
                                        "bg-brandOrange text-white hover:bg-brandOrange/90",
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="history" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Premium Plan
                            </h4>
                            <p className="text-sm text-gray-400">Nov 1, 2024</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">$19.99</p>
                            <Badge className="bg-green-500/20 text-green-400">
                              Paid
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Premium Plan
                            </h4>
                            <p className="text-sm text-gray-400">Oct 1, 2024</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">$19.99</p>
                            <Badge className="bg-green-500/20 text-green-400">
                              Paid
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Premium Plan
                            </h4>
                            <p className="text-sm text-gray-400">Sep 1, 2024</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">$19.99</p>
                            <Badge className="bg-green-500/20 text-green-400">
                              Paid
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="invoices" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Invoice #INV-2024-11
                            </h4>
                            <p className="text-sm text-gray-400">Nov 1, 2024</p>
                          </div>
                          <Button variant="outline">Download PDF</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Invoice #INV-2024-10
                            </h4>
                            <p className="text-sm text-gray-400">Oct 1, 2024</p>
                          </div>
                          <Button variant="outline">Download PDF</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <h4 className="font-medium text-white">
                              Invoice #INV-2024-09
                            </h4>
                            <p className="text-sm text-gray-400">Sep 1, 2024</p>
                          </div>
                          <Button variant="outline">Download PDF</Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="bg-gray-800 rounded-xl p-6 border border-brandOrange/30">
            <h2 className="text-xl font-bold text-white mb-4">Activity</h2>
            <div className="space-y-4">
              {/* Recent Posts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-white">Recent Posts</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search posts..."
                        className="pl-8 pr-4 py-2 bg-gray-700/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brandOrange/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="h-4 w-4" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                        <DropdownMenuLabel className="text-gray-300">
                          Filter by
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                            postFilter === "all" ? "text-brandOrange" : ""
                          }`}
                          onClick={() => setPostFilter("all")}
                        >
                          All Posts
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                            postFilter === "workouts" ? "text-brandOrange" : ""
                          }`}
                          onClick={() => setPostFilter("workouts")}
                        >
                          Workouts
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                            postFilter === "nutrition" ? "text-brandOrange" : ""
                          }`}
                          onClick={() => setPostFilter("nutrition")}
                        >
                          Nutrition
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                            postFilter === "progress" ? "text-brandOrange" : ""
                          }`}
                          onClick={() => setPostFilter("progress")}
                        >
                          Progress Updates
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                  <Image
                    src="/images/default-avatar.png"
                    alt={currentUser?.username || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {currentUser?.username}
                      </h4>
                      <span className="text-xs text-gray-400">2 hours ago</span>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        Workout
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Just completed an intense HIIT workout! 💪 Feeling
                      amazing!
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <Heart className="w-4 h-4" /> 24
                      </button>
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> 8
                      </button>
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <Share className="w-4 h-4" /> Share
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                  <Image
                    src="/images/default-avatar.png"
                    alt={currentUser?.username || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">
                        {currentUser?.username}
                      </h4>
                      <span className="text-xs text-gray-400">1 day ago</span>
                      <Badge className="bg-green-500/20 text-green-400">
                        Progress
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      New personal record on deadlifts! 🏋️‍♂️ 225lbs x 5
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <Heart className="w-4 h-4" /> 42
                      </button>
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> 12
                      </button>
                      <button className="text-sm text-gray-400 hover:text-brandOrange transition-colors flex items-center gap-1">
                        <Share className="w-4 h-4" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of 10
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === 10}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Following */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">Following</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Follow New
              </Button>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&crop=faces&fit=crop&auto=format&q=80"
                alt="Sarah Fitness"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex-1">
                <h4 className="font-medium text-white">Sarah Fitness</h4>
                <p className="text-sm text-gray-400">HIIT Specialist</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Unfollow
              </Button>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
              <Image
                src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=150&h=150&crop=faces&fit=crop&auto=format&q=80"
                alt="Yoga Master"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex-1">
                <h4 className="font-medium text-white">Yoga Master</h4>
                <p className="text-sm text-gray-400">Yoga Instructor</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Unfollow
              </Button>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowingPage((prev) => Math.max(1, prev - 1))}
              disabled={followingPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Page {followingPage} of 5
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowingPage((prev) => prev + 1)}
              disabled={followingPage === 5}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
