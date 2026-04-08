import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, CheckCircle, AlertTriangle, TrendingUp, Loader2, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'
import axios from 'axios'

const AIDetection = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const addToast = useToastStore((state) => state.addToast)
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [results, setResults] = useState(null)
    
    // The images passed from ImageUpload.jsx
    const uploadedImages = location.state?.images || {}
    const aiServerUrl = 'http://localhost:8000'

    const runInference = async () => {
        const imageKeys = Object.keys(uploadedImages)
        if (imageKeys.length === 0) {
            setError("No images found for analysis. Please go back and upload images.")
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            
            // We use the 'top' view or the first available image for detection
            const targetKey = uploadedImages['top'] ? 'top' : imageKeys[0]
            const imageFile = uploadedImages[targetKey].file

            const formData = new FormData()
            formData.append('file', imageFile)
            formData.append('conf', '0.25')

            const response = await axios.post(`${aiServerUrl}/predict`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            // Backend returns detection results (detections, count, etc)
            setResults(response.data)
            
            addToast({
                type: 'success',
                title: 'Analysis Complete',
                message: `AI detected ${response.data.detections.length} areas of interest.`,
            })
        } catch (err) {
            console.error("AI Inference Error:", err)
            setError("The AI server is currently offline or unreachable. Please ensure the FastAPI server is running on port 8000.")
            addToast({
                type: 'error',
                title: 'Analysis Failed',
                message: 'Could not connect to the AI Inference server.',
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        runInference()
    }, [])

    const handleContinue = () => {
        const docId = location.state?.doctorId || ''
        addToast({
            type: 'info',
            title: 'Proceeding...',
            message: 'Sharing results with your selected specialist.',
        })
        navigate('/patient/dermatologists', { state: { aiResults: results } })
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <Breadcrumbs items={[
                { label: 'Dashboard', link: '/dashboard/patient' },
                { label: 'Image Upload', link: '/patient/upload' },
                { label: 'AI Analysis' },
            ]} />
            
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">AI Diagnostic Analysis</h1>
                    <p className="text-slate-500 font-medium italic">Our neural network is processing your medical imagery for automated detection.</p>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Privacy Protected</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="py-20 flex flex-col items-center justify-center border-none shadow-2xl shadow-emerald-50 rounded-3xl ring-1 ring-slate-100">
                            <div className="relative mb-8">
                                <Loader2 className="w-20 h-20 text-emerald-500 animate-spin" />
                                <Brain className="w-10 h-10 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Analyzing Patterns...</h3>
                            <p className="text-slate-500 max-w-sm text-center font-medium italic">Scanning multi-angle imagery for visual markers of dermatological conditions.</p>
                        </Card>
                    </motion.div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="py-12 border-none bg-red-50 ring-1 ring-red-100 rounded-3xl text-center">
                            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-900 mb-2">Inference Engine Offline</h3>
                            <p className="text-red-700 max-w-md mx-auto mb-6">{error}</p>
                            <Button onClick={runInference} className="bg-red-600 hover:bg-red-700 rounded-2xl">
                                <RefreshCw className="w-4 h-4 mr-2" /> Retry Analysis
                            </Button>
                        </Card>
                    </motion.div>
                ) : results ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        {/* Results Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 p-8 border-none ring-1 ring-slate-100 shadow-xl rounded-3xl bg-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Brain className="w-48 h-48" />
                                </div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">Analysis Summary</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">YOLOv8 Detection Engine</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {results.detections.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {results.detections.map((det, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Marker {i + 1}</p>
                                                        <p className="text-lg font-black text-slate-900">{det.class_name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Confidence</p>
                                                        <p className="text-xl font-black text-emerald-600">{(det.confidence * 100).toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                            <p className="font-bold text-emerald-900">No significant visual markers detected.</p>
                                            <p className="text-sm text-emerald-700 italic">The AI analysis did not identify any typical patterns for the scanned conditions.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="bg-slate-900 p-8 border-none rounded-3xl text-white shadow-2xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-black mb-4">Total Findings</h3>
                                    <div className="text-6xl font-black mb-2 text-emerald-400">{results.count}</div>
                                    <p className="text-slate-400 font-medium italic">Confirmed detections within the primary visual input.</p>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-slate-800">
                                    <div className="flex items-center gap-3 text-amber-400 mb-4">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-xs font-bold leading-relaxed italic uppercase tracking-tighter">AI Analysis is not a substitute for professional medical advice.</p>
                                    </div>
                                    <Button onClick={handleContinue} className="w-full bg-emerald-500 hover:bg-emerald-600 h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
                                        Submit to Expert <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Detailed Disclaimers */}
                        <div className="bg-white p-6 rounded-3xl ring-1 ring-slate-100 shadow-sm flex items-start gap-4">
                            <div className="bg-amber-100 p-3 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-amber-700" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm uppercase mb-1">Diagnostic Disclaimer</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                                    DermMate's AI model identifies potential visual markers based on its training data. 
                                    Accuracy can vary based on image quality, lighting, and camera angle. 
                                    A verified dermatologist review is MANDATORY for a clinical diagnosis.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default AIDetection
