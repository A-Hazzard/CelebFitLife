export default function Stepper({ currentStep }: { currentStep: number }) {
    const steps = ['Basic Info', 'Select Plan', 'Payment', 'Select Streamers'];
    return (
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => (
          <div key={index} className={`text-sm ${index + 1 === currentStep ? 'text-brandOrange' : 'text-brandWhite'}`}>{step}</div>
        ))}
      </div>
    );
  }