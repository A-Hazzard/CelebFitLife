export default function StripeForm({ onSuccess }: { onSuccess: (data?: string) => void }) {
    return (
      <div className="bg-brandGray p-4 rounded-lg text-center">
        <h2 className="text-lg text-brandWhite mb-2">Payment Placeholder</h2>
        <p className="text-sm text-brandWhite mb-4">Stripe payment will be implemented here.</p>
        <button onClick={() => onSuccess()} className="bg-brandOrange text-brandBlack px-4 py-2 rounded-full">
          Continue
        </button>
      </div>
    );
  }
  