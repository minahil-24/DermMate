import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { User, Phone, MapPin, Building, Activity, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const Onboarding = () => {
    const { user, updateUser, token } = useAuthStore();
    const addToast = useToastStore((state) => state.addToast);
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        age: '',
        phoneNumber: '',
        location: '',
        clinicName: '',
        specialty: user?.specialty || '',
        gender: '',
        experience: '',
    });

    const isPatient = user?.role === 'patient';

    const patientSteps = [
        {
            id: 'age',
            question: "How old are you?",
            description: "This helps us provide age-appropriate skin care advice.",
            icon: <User className="w-12 h-12 text-emerald-500" />,
            field: 'age',
            type: 'number',
            placeholder: 'Enter your age',
            validate: (val) => val > 0 && val < 120,
        },
        {
            id: 'gender',
            question: "What's your gender?",
            description: "To better understand your skin's health profile.",
            icon: <User className="w-12 h-12 text-blue-500" />,
            field: 'gender',
            type: 'select',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
            ],
            validate: (val) => ['male', 'female'].includes(val),
        },
        {
            id: 'phoneNumber',
            question: "What's your phone number?",
            description: "We'll use this for appointment reminders. Must start with +92.",
            icon: <Phone className="w-12 h-12 text-purple-500" />,
            field: 'phoneNumber',
            type: 'tel',
            placeholder: '+923001234567',
            validate: (val) => /^\+92\d{10}$/.test(val),
            error: "Phone number must be +92 followed by 10 digits"
        },
        {
            id: 'location',
            question: "Where are you located?",
            description: "To find the best dermatologists near you.",
            icon: <MapPin className="w-12 h-12 text-rose-500" />,
            field: 'location',
            type: 'text',
            placeholder: 'City, Country',
            validate: (val) => val.length > 2,
        }
    ];

    const doctorSteps = [
        {
            id: 'gender',
            question: "What's your gender?",
            description: "Help patients find the right specialist for them.",
            icon: <User className="w-12 h-12 text-emerald-500" />,
            field: 'gender',
            type: 'select',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
            ],
            validate: (val) => ['male', 'female'].includes(val),
        },
        {
            id: 'location',
            question: "Where is your primary location?",
            description: "Let patients know where you practice.",
            icon: <MapPin className="w-12 h-12 text-blue-500" />,
            field: 'location',
            type: 'text',
            placeholder: 'City, Country',
            validate: (val) => val.length > 2,
        },
        {
            id: 'phoneNumber',
            question: "Professional Contact Number?",
            description: "Must start with +92 followed by 10 digits.",
            icon: <Phone className="w-12 h-12 text-purple-500" />,
            field: 'phoneNumber',
            type: 'tel',
            placeholder: '+923001234567',
            validate: (val) => /^\+92\d{10}$/.test(val),
            error: "Phone number must be +92 followed by 10 digits"
        },
        {
            id: 'experience',
            question: "How many years of experience?",
            description: "Build trust by highlighting your expertise.",
            icon: <Activity className="w-12 h-12 text-amber-500" />,
            field: 'experience',
            type: 'number',
            placeholder: 'e.g. 10',
            validate: (val) => val >= 0 && val < 60,
        },
        {
            id: 'clinicName',
            question: "What's your clinic name?",
            description: "The name of your primary clinic or hospital.",
            icon: <Building className="w-12 h-12 text-rose-500" />,
            field: 'clinicName',
            type: 'text',
            placeholder: 'e.g. Skin Care Center',
            validate: (val) => val.length > 2,
        },
        {
            id: 'specialty',
            question: "What's your specialty?",
            description: "Confirm your area of expertise.",
            icon: <Activity className="w-12 h-12 text-emerald-500" />,
            field: 'specialty',
            type: 'text',
            placeholder: 'e.g. Cosmetic Dermatology',
            validate: (val) => val.length > 2,
        }
    ];

    const steps = isPatient ? patientSteps : doctorSteps;
    const currentStep = steps[step];

    const handleNext = () => {
        if (currentStep.validate(formData[currentStep.field])) {
            if (step < steps.length - 1) {
                setStep(step + 1);
            } else {
                handleSubmit();
            }
        } else {
            addToast({
                type: 'error',
                title: 'Invalid Input',
                message: currentStep.error || 'Please provide a valid answer',
            });
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!token) {
            console.error('No token found in store');
            addToast({ type: 'error', title: 'Session Expired', message: 'Please login again' });
            navigate('/login');
            return;
        }

        setLoading(true);
        console.log('Submitting onboarding data:', formData);

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const fullUrl = `${apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl}/api/auth/profile`;
            console.log('Request URL:', fullUrl);

            const response = await fetch(fullUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            console.log('Response status:', response.status);

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response received:', text);
                throw new Error('Server returned an unexpected response format');
            }

            console.log('Response data:', data);

            if (response.ok) {
                updateUser(data.user);
                addToast({
                    type: 'success',
                    title: 'Onboarding Complete',
                    message: 'Welcome to DermMate!',
                });

                // Use a small timeout to ensure store state propagates
                setTimeout(() => {
                    const target = `/dashboard/${data.user.role}`;
                    console.log('Navigating to:', target);
                    navigate(target);
                }, 100);
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Onboarding Error:', error);
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to update profile',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to DermMate</h1>
                    <p className="text-slate-600">Let's set up your profile to give you the best experience.</p>

                    <div className="flex justify-center gap-2 mt-6">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 w-12 rounded-full transition-all duration-300 ${idx === step ? 'bg-emerald-500 w-16' : idx < step ? 'bg-emerald-200' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="p-8 shadow-xl border-none bg-white rounded-3xl">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 p-4 bg-slate-50 rounded-2xl">
                                    {currentStep.icon}
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentStep.question}</h2>
                                <p className="text-slate-500 mb-8">{currentStep.description}</p>

                                <div className="w-full mb-8">
                                    {currentStep.type === 'select' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {currentStep.options.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        setFormData({ ...formData, [currentStep.field]: opt.value });
                                                        // Auto-advance for better UX
                                                        setTimeout(handleNext, 300);
                                                    }}
                                                    className={`py-6 rounded-2xl border-2 transition-all font-semibold text-lg ${formData[currentStep.field] === opt.value
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-200/50'
                                                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type={currentStep.type}
                                            value={formData[currentStep.field]}
                                            onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
                                            placeholder={currentStep.placeholder}
                                            autoFocus
                                            className="w-full px-6 py-4 text-lg border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-center font-medium"
                                            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                                        />
                                    )}
                                </div>

                                <div className="flex w-full gap-4">
                                    {step > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="flex-1 py-4 rounded-xl border-2 hover:bg-slate-50"
                                        >
                                            <ArrowLeft className="w-5 h-5 mr-2" /> Back
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleNext}
                                        disabled={loading}
                                        className="flex-[2] py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <>
                                                {step === steps.length - 1 ? 'Finish' : 'Next'}
                                                {step === steps.length - 1 ? <CheckCircle className="w-5 h-5 ml-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
