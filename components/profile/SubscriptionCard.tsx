import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Rocket, RefreshCw, CreditCard, Calendar } from 'lucide-react';

export default function SubscriptionCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const SubscriptionModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-brandDarkGray border-2 border-brandOrange rounded-lg w-full max-w-md mx-4 p-6 relative shadow-2xl transform transition-all duration-300 ease-in-out scale-100 hover:scale-105">
        {/* Close Button */}
        <button 
          onClick={() => setIsModalOpen(false)} 
          className="absolute top-4 right-4 text-brandGray hover:text-brandWhite bg-brandGray/20 rounded-full p-2"
        >
          <X size={24} />
        </button>

        {/* Modal Header */}
        <h2 className="text-2xl font-bold text-brandWhite mb-4 border-b border-brandOrange pb-2">Subscription Management</h2>
        <p className="text-brandGray text-sm mb-6">Manage your CelebFitLife subscription</p>

        {/* Subscription Options */}
        <div className="space-y-4">
          {/* Renew Subscription */}
          <div className="flex items-center space-x-4 p-4 bg-brandGray/20 rounded-lg hover:bg-brandGray/30 cursor-pointer transition-all duration-200">
            <RefreshCw className="text-brandOrange" size={28} />
            <div>
              <h3 className="text-brandWhite font-semibold text-lg">Renew Subscription</h3>
              <p className="text-brandGray text-sm">Continue your current Plus plan</p>
            </div>
          </div>

          {/* Upgrade Plan */}
          <div className="flex items-center space-x-4 p-4 bg-brandGray/20 rounded-lg hover:bg-brandGray/30 cursor-pointer transition-all duration-200">
            <Rocket className="text-brandOrange" size={28} />
            <div>
              <h3 className="text-brandWhite font-semibold text-lg">Upgrade Plan</h3>
              <p className="text-brandGray text-sm">Unlock premium features</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center space-x-4 p-4 bg-brandGray/20 rounded-lg hover:bg-brandGray/30 cursor-pointer transition-all duration-200">
            <CreditCard className="text-brandOrange" size={28} />
            <div>
              <h3 className="text-brandWhite font-semibold text-lg">Payment Methods</h3>
              <p className="text-brandGray text-sm">Update your billing information</p>
            </div>
          </div>

          {/* Billing History */}
          <div className="flex items-center space-x-4 p-4 bg-brandGray/20 rounded-lg hover:bg-brandGray/30 cursor-pointer transition-all duration-200">
            <Calendar className="text-brandOrange" size={28} />
            <div>
              <h3 className="text-brandWhite font-semibold text-lg">Billing History</h3>
              <p className="text-brandGray text-sm">View past invoices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-brandGray p-4 rounded-lg shadow-md text-center mb-6">
      <h2 className="text-lg text-brandWhite font-semibold">Current Plan: <span className="text-brandOrange">Plus</span></h2>
      <p className="text-sm text-brandWhite">Renews on: March 10, 2025</p>
      
      <Button 
        onClick={() => setIsModalOpen(true)}
        variant="default" 
        className="bg-brandOrange text-brandBlack hover:bg-brandOrange/80 px-4 py-2 mt-4 rounded-full"
      >
        Manage Subscription
      </Button>

      {/* Render modal if open */}
      {isModalOpen && <SubscriptionModal />}
    </div>
  );
}