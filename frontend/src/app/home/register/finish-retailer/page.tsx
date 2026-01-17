"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import Navbar from "@/components/Navbar";

// Icons as inline SVGs
const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BuildingStorefrontIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
    </svg>
);

const EnvelopeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

// Types
type Step = 1 | 2 | 3;

const StepIndicator = ({ currentStep, totalSteps = 3 }: { currentStep: Step, totalSteps?: number }) => {
    const stepLabels = ['Store Info', 'Location', 'Contact'];
    const segmentCount = totalSteps - 1;
    const progressWidthPercentage = segmentCount > 0 ? (Math.max(0, currentStep - 1) / segmentCount) * 100 : 0;
    const lineStartOffset = '5%';
    const lineEndOffset = '5%';
    const totalLineWidth = `calc(100% - ${lineStartOffset} - ${lineEndOffset})`;

    return (
        <nav aria-label="Progress" className="mb-8 w-full overflow-hidden">
            <div className="relative flex justify-between items-start w-full px-2 sm:px-4">
                {/* Background Line */}
                <div className="absolute top-4 h-0.5 bg-gray-300" style={{ left: lineStartOffset, width: totalLineWidth }} aria-hidden="true" />
                {/* Progress Line */}
                <div className="absolute top-4 h-1 bg-rose-600 transition-width duration-300 ease-in-out" style={{ left: lineStartOffset, width: `calc(${totalLineWidth} * ${progressWidthPercentage / 100})` }} aria-hidden="true" />
                {/* Step Markers */}
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNumber = index + 1; const isCompleted = stepNumber < currentStep; const isActive = stepNumber === currentStep;
                    return (
                        <div key={stepNumber} className="flex flex-col items-center relative z-10 text-center px-1" style={{ minWidth: '60px' }}>
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isActive ? 'border-rose-600 bg-white' : isCompleted ? 'border-rose-600 bg-rose-600' : 'border-gray-300 bg-gray-300'} font-semibold text-white transition-colors duration-300 ease-in-out`}>
                                {isCompleted ? <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" /> : <span className={`${isActive ? 'text-rose-600' : 'text-white'}`}>{stepNumber}</span>}
                            </div>
                            <span className={`block mt-2 text-xs font-medium break-words ${isActive ? 'text-rose-600' : 'text-gray-600'}`}>{stepLabels[index] || `Step ${stepNumber}`}</span>
                        </div>);
                })}
            </div>
        </nav>);
};

export default function FinishRetailerPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [formData, setFormData] = useState({
        storeName: '',
        storeAddress: '',
        contactEmail: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (step: Step) => {
        if (step === 1 && !formData.storeName.trim()) {
            setError('Store name is required.');
            return false;
        }
        if (step === 2 && !formData.storeAddress.trim()) {
            setError('Store address is required.');
            return false;
        }
        if (step === 3 && !formData.contactEmail.trim()) {
            setError('Contact email is required.');
            return false;
        }
        setError('');
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 3) {
                setCurrentStep(prev => (prev + 1) as Step);
            } else {
                handleSubmit();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as Step);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post("store-profile/", {
                name: formData.storeName,
                street_address: formData.storeAddress,
            });
            router.push("/RetailerDashboard");
        } catch (err: any) {
            setError('Failed to complete profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-1 overflow-y-auto bg-gray-50 text-gray-900 pt-36 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-3xl mx-auto">
                    <div className="mb-5 w-full">
                        <button onClick={() => window.history.back()} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors group">
                            <ArrowLeftIcon className="h-5 w-5 mr-1 text-gray-500 group-hover:text-rose-600 transition-colors" /> Back
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold text-rose-600 text-center mb-10">Complete Your Retailer Profile</h1>

                    <StepIndicator currentStep={currentStep} totalSteps={3} />

                    {error && (
                        <div className="rounded-md bg-red-50 border border-red-300 p-4 mb-6">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={(e) => e.preventDefault()} className="bg-white shadow-xl rounded-xl p-8 sm:p-10 w-full">
                        {currentStep === 1 && (
                            <div className="space-y-8">
                                <div className="flex items-center space-x-3 pb-4 border-b border-gray-300 mb-6">
                                    <BuildingStorefrontIcon className="h-7 w-7 text-rose-600" />
                                    <h2 className="text-xl font-semibold text-rose-600">1. Store Information</h2>
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                                        Store Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="storeName"
                                        id="storeName"
                                        value={formData.storeName}
                                        onChange={handleInputChange}
                                        className="block w-full sm:text-sm rounded-md border-gray-300 shadow-sm focus:ring-rose-600 focus:border-rose-600 py-2 px-3"
                                        placeholder="Enter your store name"
                                    />
                                </div>
                                <div className="flex justify-end pt-8 border-t border-gray-300 mt-8">
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 transition-colors"
                                    >
                                        Next <ArrowRightIcon className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-8">
                                <div className="flex items-center space-x-3 pb-4 border-b border-gray-300 mb-6">
                                    <MapPinIcon className="h-7 w-7 text-rose-600" />
                                    <h2 className="text-xl font-semibold text-rose-600">2. Location Details</h2>
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700">
                                        Store Address <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="storeAddress"
                                        id="storeAddress"
                                        value={formData.storeAddress}
                                        onChange={handleInputChange}
                                        className="block w-full sm:text-sm rounded-md border-gray-300 shadow-sm focus:ring-rose-600 focus:border-rose-600 py-2 px-3"
                                        placeholder="Enter your store address"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-8 border-t border-gray-300 mt-8">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 transition-colors"
                                    >
                                        <ArrowLeftIcon className="mr-2 h-5 w-5 text-gray-500" /> Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="ml-3 inline-flex items-center justify-center px-5 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 transition-colors"
                                    >
                                        Next <ArrowRightIcon className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8">
                                <div className="flex items-center space-x-3 pb-4 border-b border-gray-300 mb-6">
                                    <EnvelopeIcon className="h-7 w-7 text-rose-600" />
                                    <h2 className="text-xl font-semibold text-rose-600">3. Contact Information</h2>
                                </div>
                                <div className="space-y-4">
                                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                                        Contact Email <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        id="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                        className="block w-full sm:text-sm rounded-md border-gray-300 shadow-sm focus:ring-rose-600 focus:border-rose-600 py-2 px-3"
                                        placeholder="Enter your contact email"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-8 border-t border-gray-300 mt-8">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 transition-colors"
                                    >
                                        <ArrowLeftIcon className="mr-2 h-5 w-5 text-gray-500" /> Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={loading}
                                        className="ml-3 inline-flex items-center justify-center px-5 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Completing...
                                            </>
                                        ) : (
                                            'Complete Profile'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
