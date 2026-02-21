import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Upload, Camera, ChevronRight, AlertCircle,
    CheckCircle2, RefreshCw, PlusCircle, Trash2, X, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useAuthStore } from '../../store/authStore';


// API Configuration - Dynamic URL based on current host
const API_BASE = `http://${window.location.hostname}:8000`;

const AlopeciaDetection = () => {
    const navigate = useNavigate();
    const { user, updateUser, token: authStoreToken } = useAuthStore();
    const [token, setToken] = useState(authStoreToken || localStorage.getItem('access_token'));
    const [username, setUsername] = useState(user?.username || localStorage.getItem('username'));

    const [authTab, setAuthTab] = useState('login');
    const [history, setHistory] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [conf, setConf] = useState(0.25);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
    const [deletedIds, setDeletedIds] = useState(() => {
        const saved = localStorage.getItem('deleted_history_ids');
        return saved ? JSON.parse(saved) : [];
    });
    const [historyImageUrl, setHistoryImageUrl] = useState(null);
    const [historyImageError, setHistoryImageError] = useState(null);
    const [historyImageLoading, setHistoryImageLoading] = useState(false);

    // Camera State
    const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'camera'
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [showCameraPreview, setShowCameraPreview] = useState(true); // Toggle video vs snapshot

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const resultsRef = useRef(null);

    useEffect(() => {
        if (token) {
            loadHistory();
        }
        return () => {
            stopCamera();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            if (historyImageUrl) URL.revokeObjectURL(historyImageUrl);
        };
    }, [token]);

    useEffect(() => {
        if (selectedHistoryItem) {
            fetchHistoryImage(selectedHistoryItem);
        } else {
            if (historyImageUrl) URL.revokeObjectURL(historyImageUrl);
            setHistoryImageUrl(null);
            setHistoryImageError(null);
        }
    }, [selectedHistoryItem]);

    // Sync Camera Stream to Video Element
    useEffect(() => {
        if (cameraActive && cameraStream && showCameraPreview && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraActive, cameraStream, showCameraPreview]);

    const loadHistory = async () => {
        try {
            const response = await axios.get(`${API_BASE}/history`, {
                headers: { 'username': username || 'anonymous' }
            });
            setHistory(response.data);
        } catch (err) {
            console.error('History load failed', err);
        }
    };

    const fetchHistoryImage = async (item) => {
        if (!item.image_filename) {
            setHistoryImageError('Image reference missing for this prediction');
            return;
        }

        setHistoryImageLoading(true);
        setHistoryImageError(null);
        try {
            // Reconstruct path: /uploads/{username}/{image_filename}
            const response = await axios.get(`${API_BASE}/uploads/${item.username || username}/${item.image_filename}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = URL.createObjectURL(response.data);
            setHistoryImageUrl(url);
        } catch (err) {
            console.error('Failed to fetch history image', err);
            setHistoryImageError('Unable to retrieve image from server');
        } finally {
            setHistoryImageLoading(false);
        }
    };

    const handleHideHistory = (id) => {
        const newDeleted = [...deletedIds, id];
        setDeletedIds(newDeleted);
        localStorage.setItem('deleted_history_ids', JSON.stringify(newDeleted));
    };

    const handleLogout = () => {
        stopCamera();
        localStorage.clear();
        setToken(null);
        setUsername(null);
        setResults(null);
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleAuth = async (e, type) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = new URLSearchParams();
        for (const pair of formData) {
            params.append(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(`${API_BASE}/${type}`, params);
            if (type === 'login') {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('username', params.get('username'));
                setToken(response.data.access_token);
                setUsername(params.get('username'));
            } else {
                alert('Registration successful! Please login.');
                setAuthTab('login');
            }
        } catch (err) {
            alert(err.response?.data?.detail || 'Authentication failed');
        }
    };

    // Camera Logic
    const startCamera = async () => {
        if (cameraActive && cameraStream) {
            setShowCameraPreview(true);
            setSelectedFile(null);
            setResults(null);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setCameraStream(stream);
            setCameraActive(true);
            setShowCameraPreview(true);
            setSelectedFile(null);
            setResults(null);
        } catch (err) {
            alert('Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setCameraActive(false);
        setShowCameraPreview(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                const url = URL.createObjectURL(file);

                setPreviewUrl(url);
                setSelectedFile(file);
                setShowCameraPreview(false); // Show the snapshot, but KEEP stream active
            }, 'image/jpeg', 0.95);
        }
    };

    const resetDetection = () => {
        setResults(null);
        if (inputMode === 'camera') {
            setShowCameraPreview(true);
            setSelectedFile(null);
        } else {
            setSelectedFile(null);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
            setSelectedFile(file);
            setResults(null);
        } else {
            alert('Please select a valid image file');
        }
    };

    const handlePredict = async () => {
        if (!selectedFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(`${API_BASE}/predict?conf=${conf}`, formData, {
                headers: {
                    'username': username || 'anonymous',
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(response.data);
            loadHistory();

            // Update profile image if detection was successful (not rejected and not "No Alopecia")
            if (response.data.status !== 'rejected' && response.data.diagnosis !== 'No Alopecia Detected') {
                // Use a mock person image instead of the alopecia detection image
                const mockProfilePic = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
                updateUser({ ...user, profilePic: mockProfilePic });
            }

            // Scroll to results
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            alert(err.response?.data?.detail || 'Prediction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
            <Breadcrumbs items={[
                { label: 'New Complaint', link: '/patient/complaint' },
                { label: 'Alopecia Detection', link: '/patient/alopecia-detection' }
            ]} />

            <main className="max-w-7xl mx-auto px-4 md:px-8">
                <header className="mb-10 mt-6 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Alopecia Detection</h1>
                    <p className="text-gray-600">Advanced neural analysis for scalp health</p>
                </header>

                <div className="flex-1 space-y-12">
                    {/* Interaction Section */}
                    <section className="mb-12">
                        <Card className="max-w-2xl mx-auto">
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                                <button
                                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${inputMode === 'upload' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => { setInputMode('upload'); stopCamera(); setResults(null); setSelectedFile(null); }}
                                >
                                    <Upload size={16} className="inline mr-2" /> Upload Image
                                </button>
                                <button
                                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${inputMode === 'camera' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => { setInputMode('camera'); startCamera(); }}
                                >
                                    <Camera size={16} className="inline mr-2" /> Live Capture
                                </button>
                            </div>

                            {inputMode === 'upload' ? (
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <input type="file" ref={fileInputRef} onChange={onFileChange} hidden />
                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all text-emerald-600">
                                        <Upload size={32} />
                                    </div>
                                    <p className="text-gray-600">
                                        {selectedFile ? (
                                            <span className="text-emerald-600 font-medium">Selected: {selectedFile.name}</span>
                                        ) : (
                                            <>Drag image here or <span className="text-emerald-600">browse files</span></>
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 relative">
                                        {showCameraPreview ? (
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
                                        ) : selectedFile ? (
                                            <img src={previewUrl} alt="Captured" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 cursor-pointer" onClick={startCamera}>
                                                <Camera size={48} className="mb-4" />
                                                <p>Tap to start camera</p>
                                            </div>
                                        )}
                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    </div>

                                    <div className="flex justify-center">
                                        {cameraActive && showCameraPreview && (
                                            <Button onClick={capturePhoto} size="lg">
                                                Take Snapshot
                                            </Button>
                                        )}
                                        {!showCameraPreview && selectedFile && inputMode === 'camera' && (
                                            <Button variant="outline" onClick={() => setShowCameraPreview(true)}>
                                                <RefreshCw size={18} className="mr-2" /> Retake
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <label className="text-gray-600 font-medium">Confidence Threshold</label>
                                    <span className="text-emerald-600 font-bold">{conf}</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="1.0" step="0.05" value={conf}
                                    onChange={(e) => setConf(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
                                />
                            </div>

                            <Button
                                className="w-full mt-8"
                                onClick={handlePredict}
                                disabled={!selectedFile || loading || showCameraPreview}
                                size="lg"
                            >
                                {loading ? (
                                    <>Analyzing Image <RefreshCw className="animate-spin ml-2" size={20} /></>
                                ) : (
                                    'Run Neural Analysis'
                                )}
                            </Button>
                        </Card>
                    </section>

                    {/* Analysis Results View */}
                    {results && (
                        <section className="mb-12" ref={resultsRef}>
                            <Card>
                                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                                    <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Analysis Intelligence</h3>
                                    <button className="text-emerald-600 font-semibold flex items-center gap-2 hover:text-emerald-700" onClick={resetDetection}>
                                        <PlusCircle size={18} /> New Analysis
                                    </button>
                                </div>

                                {results.status === 'rejected' ? (
                                    <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex items-start gap-4">
                                        <AlertCircle className="text-red-500 shrink-0" size={24} />
                                        <div>
                                            <h3 className="text-red-700 font-bold text-lg mb-1">{results.reason}</h3>
                                            <p className="text-red-600">{results.message}</p>
                                        </div>
                                    </div>
                                ) : results.diagnosis === 'No Alopecia Detected' ? (
                                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-start gap-4">
                                        <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                                        <div>
                                            <h3 className="text-emerald-700 font-bold text-lg mb-1">{results.diagnosis}</h3>
                                            <p className="text-emerald-600">{results.message}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visual Evidence</h4>
                                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                                                <img src={`data:image/png;base64,${results.annotated_image}`} alt="Result" className="w-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Neural Detections</h4>
                                            <div className="space-y-3">
                                                {results.detections.map((det, idx) => (
                                                    <div key={idx} className="bg-gray-50 border-l-4 border-emerald-500 p-4 rounded-lg flex justify-between items-center">
                                                        <div>
                                                            <h5 className="font-bold text-gray-800">{det.class_name}</h5>
                                                            <p className="text-[10px] text-gray-500 uppercase font-medium">Confidence Score</p>
                                                        </div>
                                                        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold text-sm">
                                                            {(det.confidence * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Next Steps / Actions */}
                                {results.status !== 'rejected' && (
                                    <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center border-t border-gray-100 pt-8">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="px-8 shadow-emerald-200 shadow-lg"
                                            onClick={() => navigate('/patient/questionnaire')}
                                        >
                                            Next: Medical Questionnaire <ChevronRight size={18} className="ml-2" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={resetDetection}
                                        >
                                            New Analysis
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </section>

                    )}

                    {/* History Matrix */}
                    <section>
                        <Card>
                            <h3 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4 uppercase tracking-tight">Prediction Matrix</h3>
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {history.filter(item => !deletedIds.includes(item._id)).length > 0 ? (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {history
                                            .filter(item => !deletedIds.includes(item._id))
                                            .map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group relative bg-gray-50 hover:bg-emerald-50 p-6 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all cursor-pointer transform hover:-translate-y-1"
                                                    onClick={() => setSelectedHistoryItem(item)}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="truncate pr-8">
                                                            <h4 className="font-bold text-gray-800 truncate" title={item.filename}>{item.filename}</h4>
                                                            <span className="text-xs text-gray-500 italic block mt-1">
                                                                {new Date(item.timestamp).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all absolute top-4 right-4"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleHideHistory(item._id);
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center text-[10px] text-emerald-600 uppercase tracking-widest font-bold">
                                                        View Details <ChevronRight size={10} className="ml-1" />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-gray-400 italic">
                                        No historical data found in matrix.
                                    </div>
                                )}
                            </div>
                        </Card>
                    </section>

                    {/* Intelligent Modal Overlay */}
                    {selectedHistoryItem && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedHistoryItem(null)} />

                            <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl relative z-10 animate-fade-in">
                                <button
                                    className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-all z-20"
                                    onClick={() => setSelectedHistoryItem(null)}
                                >
                                    <X size={20} />
                                </button>

                                <div className="p-8 md:p-12">
                                    <header className="mb-10 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Detailed Scan Analysis</h3>
                                        <p className="text-gray-500 text-sm flex flex-wrap items-center gap-2">
                                            Reference Image: <span className="text-emerald-600 font-mono font-semibold">{selectedHistoryItem.image_filename}</span>
                                            <span className="hidden md:inline text-gray-300">|</span>
                                            Performed: {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                                        </p>
                                    </header>

                                    {selectedHistoryItem.status === 'rejected' ? (
                                        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl">
                                            <h3 className="text-red-700 font-bold text-xl mb-3 flex items-center gap-2">
                                                <AlertCircle /> Analysis Aborted
                                            </h3>
                                            <p className="text-red-600 leading-relaxed text-lg">
                                                {selectedHistoryItem.message || "The input image failed neural validation standards."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid lg:grid-cols-5 gap-12">
                                            <div className="lg:col-span-3 space-y-6">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Analyzed Image</h4>
                                                <div className="aspect-square lg:aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 relative flex items-center justify-center shadow-inner">
                                                    {historyImageLoading ? (
                                                        <div className="flex flex-col items-center gap-4 text-gray-400">
                                                            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                                                            <p className="text-sm font-bold">Retrieving from server...</p>
                                                        </div>
                                                    ) : historyImageError ? (
                                                        <div className="text-center p-8 text-red-500 bg-red-50 w-full h-full flex flex-col items-center justify-center">
                                                            <AlertCircle size={48} className="mb-4 opacity-50" />
                                                            <p className="text-lg font-bold mb-1">
                                                                {selectedHistoryItem.image_filename ? 'Asset Missing' : 'Incomplete Fragment'}
                                                            </p>
                                                            <p className="text-sm text-red-500/50 max-w-xs">{historyImageError}</p>
                                                        </div>
                                                    ) : (
                                                        <img src={historyImageUrl} alt="Analyzed" className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-2 flex flex-col justify-center">
                                                <div className="space-y-10">
                                                    {selectedHistoryItem.diagnosis === 'No Alopecia Detected' ? (
                                                        <div className="space-y-4">
                                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Medical Outcome</h4>
                                                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-8 rounded-xl shadow-sm">
                                                                <h5 className="text-emerald-700 font-bold text-xl mb-2">Optimal Health</h5>
                                                                <p className="text-emerald-600 leading-relaxed">Neural analysis found no significant indicators of alopecia. Scalp density appears healthy.</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Neural Intelligence</h4>
                                                            <div className="space-y-4">
                                                                {selectedHistoryItem.detections && selectedHistoryItem.detections.map((det, idx) => (
                                                                    <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex justify-between items-center group hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                                                                        <div>
                                                                            <h5 className="font-bold text-gray-800 text-lg">{det.class_name}</h5>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${det.confidence * 100}%` }} />
                                                                                </div>
                                                                                <span className="text-[10px] text-gray-400 font-bold">ACCURACY</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-emerald-600">
                                                                            {(det.confidence * 100).toFixed(1)}<span className="text-[10px] ml-0.5 opacity-50">%</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="mt-20 py-10 text-center border-t border-gray-100">
                <p className="text-gray-400 text-sm font-medium">
                    &copy; 2026 <span className="text-emerald-600 font-semibold">DermMate Vision</span>.
                    <span className="mx-3 opacity-20">|</span>
                    Intelligent Alopecia Analysis
                </p>
            </footer>
        </div>
    );
};

export default AlopeciaDetection;
