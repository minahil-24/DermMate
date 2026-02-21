import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token provided');
      return;
    }

    // STRICT MODE GUARD: Prevent double firing
    if (hasVerified.current) {
      console.log("Already attempting verification, skipping.");
      return;
    }
    hasVerified.current = true;

    console.log("Sending verification request for token:", token);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(({ status, body }) => {
        console.log("Verification response:", status, body);
        if (status === 200) {
          setStatus('success');
          setMessage(body.message);
        } else {
          setStatus('error');
          setMessage(body.message || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage("Verification failed due to network error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-white/90 text-center p-8">
          {status === 'verifying' && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-800">Verifying Email...</h2>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Login Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
