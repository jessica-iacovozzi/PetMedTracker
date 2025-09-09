"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Heart, ArrowLeft } from "lucide-react";
import OnboardingWelcome from "./onboarding-welcome";
import OnboardingPetSetup from "./onboarding-pet-setup";
import OnboardingMedicationSetup from "./onboarding-medication-setup";
import OnboardingNotificationSetup from "./onboarding-notification-setup";
import OnboardingCompletion from "./onboarding-completion";
import { useRouter } from "next/navigation";

interface OnboardingData {
  pet?: {
    name: string;
    species: string;
    photo?: string;
  };
  medication?: {
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    duration?: string;
  };
  notifications?: {
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const steps = [
    { title: "Welcome", component: OnboardingWelcome },
    { title: "Add Your Pet", component: OnboardingPetSetup },
    { title: "First Medication", component: OnboardingMedicationSetup },
    { title: "Notifications", component: OnboardingNotificationSetup },
    { title: "All Set!", component: OnboardingCompletion },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setOnboardingData({ ...onboardingData, ...stepData });
    handleNext();
  };

  const handleSkip = () => {
    handleNext();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">PetMeds Setup</h1>
          </div>
          <p className="text-gray-600">
            Let's get you started with managing your pet's medications
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <CurrentStepComponent
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              data={onboardingData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={handleSkip} variant="ghost" disabled={isLoading}>
              Skip for now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
