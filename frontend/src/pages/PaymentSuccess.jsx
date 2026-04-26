import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const addToast = useToastStore((s) => s.addToast);
    
    const sessionId = searchParams.get('session_id');
    const type = searchParams.get('type');
    const caseId = searchParams.get('caseId');
    
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (!token || !sessionId) return;
        
        const finalizePayment = async () => {
            try {
                if (type === 'patient') {
                    await axios.post(`${apiUrl}/api/billing/stripe/finalize-patient-payment`, 
                        { session_id: sessionId, caseId }, 
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else if (type === 'dermatologist') {
                    // Similar to pay endpoint but uses session id
                    await axios.post(`${apiUrl}/api/billing/pay`, 
                        { session_id: sessionId }, 
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
                
                setStatus('success');
                addToast({ type: 'success', title: 'Payment Confirmed', message: 'Your payment was successful.' });
                
                setTimeout(() => {
                    const redirectRole = searchParams.get('type') || (token ? JSON.parse(atob(token.split('.')[1])).role : 'patient');
                    navigate(redirectRole === 'patient' ? '/patient/cases' : '/dermatologist/payments');
                }, 3000);
            } catch (error) {
                console.error('Finalization error detail:', error.response?.data || error.message);
                setStatus('error');
                addToast({ type: 'error', title: 'Payment Error', message: error.response?.data?.message || 'Failed to verify payment.' });
            }
        };
        
        finalizePayment();
    }, [sessionId, type, caseId, token, apiUrl, addToast, navigate]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-16 h-16 animate-spin text-emerald-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
                <p className="text-gray-500 mt-2">Please do not refresh the page.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                    <XCircle className="w-20 h-20 text-red-500 mb-6 mx-auto" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 text-center">Verification Failed</h2>
                <p className="text-gray-600 mt-4 text-center">We could not verify your payment. Please contact support or try again.</p>
                <Button className="mt-8" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto">
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle className="w-24 h-24 text-emerald-500 mb-6 mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">Payment Successful!</h2>
            <p className="text-gray-600 text-center">Thank you! Your payment has been securely processed and recorded.</p>
            
            <Card className="w-full mt-8 bg-gray-50 border border-gray-100">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-sm font-semibold truncate max-w-[200px]" title={sessionId}>{sessionId}</span>
                </div>
                {type === 'patient' && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500">Case ID</span>
                        <span className="font-mono text-sm font-semibold truncate max-w-[200px]">{caseId}</span>
                    </div>
                )}
            </Card>
            
            <p className="text-sm text-gray-400 mt-8 animate-pulse">Redirecting you shortly...</p>
        </div>
    );
};

export default PaymentSuccess;
