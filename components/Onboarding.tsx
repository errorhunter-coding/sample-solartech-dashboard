import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  isActive: boolean;
  onClose: () => void;
}

const steps = [
  {
    target: 'nav-dashboard',
    title: 'Your Dashboard',
    content: 'Get a bird\'s eye view of your entire solar array performance, weather forecasts, and alerts.'
  },
  {
    target: 'nav-devices',
    title: 'Manage Devices',
    content: 'Add new ESP32 monitoring units, view live telemetry, and organize sensors into groups.'
  },
  {
    target: 'nav-analysis',
    title: 'AI Fault Detection',
    content: 'Upload photos of your panels. Our Gemini AI will detect cracks, soiling, and hotspots instantly.'
  },
  {
    target: 'nav-assistant',
    title: 'Ask SolarBot',
    content: 'Have a technical question? Chat with our AI expert powered by Gemini 3 Pro.'
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ isActive, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const targetId = steps[currentStep].target;
      const element = document.getElementById(targetId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.left + rect.width + 20, // Position to the right
          height: rect.height
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] pointer-events-auto" />

      {/* Highlight Hole (Simulated by layout, simpler than complex masking for this demo) */}
      {/* In a real robust app we'd use SVG masking or box-shadow hacks. For simplicity, we just float the card. */}
      
      {/* Tooltip Card */}
      <div 
        className="absolute pointer-events-auto transition-all duration-300 ease-out"
        style={{ 
          top: position.top, 
          left: window.innerWidth < 768 ? '50%' : position.left,
          transform: window.innerWidth < 768 ? 'translate(-50%, 60px)' : 'translate(0, 0)'
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 relative animate-fade-in-up">
          <div className="absolute -left-2 top-6 w-4 h-4 bg-white transform rotate-45 hidden md:block"></div>
          
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2 items-center">
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                {currentStep + 1}/{steps.length}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-2">{steps[currentStep].title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {steps[currentStep].content}
          </p>
          
          <div className="flex justify-end">
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-slate-200"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep === steps.length - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
