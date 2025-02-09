export default function SubscriptionCard() {
    return (
      <div className="bg-brandGray p-4 rounded-lg shadow-md text-center mb-6">
        <h2 className="text-lg text-brandWhite font-semibold">Current Plan: <span className="text-brandOrange">Plus</span></h2>
        <p className="text-sm text-brandWhite">Renews on: March 10, 2025</p>
        <button className="bg-brandOrange text-brandBlack px-4 py-2 mt-4 rounded-full">Manage Subscription</button>
      </div>
    );
  }
  