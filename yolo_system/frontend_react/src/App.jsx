import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Camera, LogOut, ChevronRight, AlertCircle, CheckCircle2, RefreshCw, PlusCircle, Trash2, X } from 'lucide-react';

// API Configuration
const API_BASE = '/api';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [username, setUsername] = useState(localStorage.getItem('username'));
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
                headers: { Authorization: `Bearer ${token}` }
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
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResults(response.data);
            loadHistory();
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

    if (!token) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
                <header className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
                        YOLOv8 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Vision</span>
                    </h1>
                    <p className="text-slate-400 text-lg">Advanced Alopecia Detection System</p>
                </header>

                <div className="glass w-full max-w-md p-8 rounded-3xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex gap-4 mb-8 border-b border-white/10">
                        <button
                            className={`pb-4 text-sm font-bold transition-all ${authTab === 'login' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setAuthTab('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`pb-4 text-sm font-bold transition-all ${authTab === 'register' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
                            onClick={() => setAuthTab('register')}
                        >
                            Register
                        </button>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => handleAuth(e, authTab)}>
                        <input
                            type="text" name="username" placeholder="Username" required
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <input
                            type="password" name="password" placeholder="Password" required
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                        />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-xl transition-all transform hover:-translate-y-1 active:scale-95 shadow-lg shadow-indigo-500/20">
                            {authTab === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 animate-fade-in">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        YOLOv8 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">Vision</span>
                    </h1>
                    <p className="text-slate-400">Scalp Health Intelligence</p>
                </div>
                <div className="flex items-center gap-4 glass px-6 py-3 rounded-2xl">
                    <div className="text-sm font-medium text-slate-300">
                        <span className="text-slate-500 mr-2 italic text-xs">connected:</span>
                        {username}
                    </div>
                    <button
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 space-y-12">
                {/* Interaction Section */}
                <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="glass p-6 md:p-8 rounded-[2rem] max-w-2xl mx-auto">
                        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                            <button
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'upload' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                                onClick={() => { setInputMode('upload'); stopCamera(); setResults(null); setSelectedFile(null); }}
                            >
                                <Upload size={16} className="inline mr-2" /> Upload
                            </button>
                            <button
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${inputMode === 'camera' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                                onClick={() => { setInputMode('camera'); startCamera(); }}
                            >
                                <Camera size={16} className="inline mr-2" /> Live Capture
                            </button>
                        </div>

                        {inputMode === 'upload' ? (
                            <div
                                className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-white/5 transition-all group"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={onFileChange} hidden />
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all text-indigo-400">
                                    <Upload size={32} />
                                </div>
                                <p className="text-slate-400">
                                    {selectedFile ? (
                                        <span className="text-indigo-400 font-medium">Selected: {selectedFile.name}</span>
                                    ) : (
                                        <>Drop image here or <span className="text-indigo-400">browse files</span></>
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
                                        <button className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform" onClick={capturePhoto}>
                                            Take Snapshot
                                        </button>
                                    )}
                                    {!showCameraPreview && selectedFile && inputMode === 'camera' && (
                                        <button className="bg-white/10 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/20 flex items-center gap-2 transition-all" onClick={() => setShowCameraPreview(true)}>
                                            <RefreshCw size={18} /> Retake
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 space-y-3">
                            <div className="flex justify-between text-sm">
                                <label className="text-slate-400">Confidence Threshold</label>
                                <span className="text-indigo-400 font-bold">{conf}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="1.0" step="0.05" value={conf}
                                onChange={(e) => setConf(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <button
                            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                            onClick={handlePredict}
                            disabled={!selectedFile || loading || showCameraPreview}
                        >
                            {loading ? (
                                <>Analyzing Image <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                            ) : (
                                'Run Neural Analysis'
                            )}
                        </button>
                    </div>
                </section>

                {/* Analysis Results View */}
                {results && (
                    <section className="animate-fade-in" ref={resultsRef}>
                        <div className="glass p-8 rounded-[2rem]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-slate-300">Analysis Intelligence</h3>
                                <button className="text-indigo-400 font-semibold flex items-center gap-2 hover:indigo-300" onClick={resetDetection}>
                                    <PlusCircle size={18} /> New Analysis
                                </button>
                            </div>

                            {results.status === 'rejected' ? (
                                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="text-red-400 shrink-0" size={24} />
                                    <div>
                                        <h3 className="text-red-400 font-bold text-lg mb-1">{results.reason}</h3>
                                        <p className="text-red-300/80">{results.message}</p>
                                    </div>
                                </div>
                            ) : results.diagnosis === 'No Alopecia Detected' ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-start gap-4">
                                    <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                                    <div>
                                        <h3 className="text-emerald-400 font-bold text-lg mb-1">{results.diagnosis}</h3>
                                        <p className="text-emerald-300/80">{results.message}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Visual Evidence</h4>
                                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                            <img src={`data:image/png;base64,${results.annotated_image}`} alt="Result" className="w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Neural Detections</h4>
                                        <div className="space-y-3">
                                            {results.detections.map((det, idx) => (
                                                <div key={idx} className="bg-white/5 border-l-4 border-indigo-500 p-4 rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-bold text-slate-100">{det.class_name}</h5>
                                                        <p className="text-xs text-slate-400 uppercase">Detection Confidence</p>
                                                    </div>
                                                    <div className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-mono font-bold text-sm">
                                                        {(det.confidence * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* History Matrix */}
                <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="glass p-8 rounded-[2rem]">
                        <h3 className="text-xl font-bold text-slate-300 mb-8">Prediction Matrix</h3>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 -mr-4">
                            {history.filter(item => !deletedIds.includes(item._id)).length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {history
                                        .filter(item => !deletedIds.includes(item._id))
                                        .map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 transition-all cursor-pointer transform hover:-translate-y-1"
                                                onClick={() => setSelectedHistoryItem(item)}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="truncate pr-8">
                                                        <h4 className="font-bold text-slate-200 truncate" title={item.filename}>{item.filename}</h4>
                                                        <span className="text-xs text-slate-500 italic block mt-1">
                                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all absolute top-4 right-4"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleHideHistory(item._id);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                    View Intelligence <ChevronRight size={10} className="ml-1" />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-slate-500 italic font-medium">
                                    No historical data found in matrix.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Intelligent Modal Overlay */}
                {selectedHistoryItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm" onClick={() => setSelectedHistoryItem(null)} />

                        <div className="glass w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[2.5rem] relative relative z-10 animate-fade-in">
                            <button
                                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all z-20"
                                onClick={() => setSelectedHistoryItem(null)}
                            >
                                <X size={20} />
                            </button>

                            <div className="p-8 md:p-12">
                                <header className="mb-10">
                                    <h3 className="text-2xl font-bold text-slate-100 mb-2">Detailed Scan Analysis</h3>
                                    <p className="text-slate-400 text-sm flex items-center gap-2">
                                        Reference Image: <span className="text-indigo-400 font-mono">{selectedHistoryItem.image_filename}</span>
                                        <span className="text-slate-600">|</span>
                                        Performed: {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                                    </p>
                                </header>

                                {selectedHistoryItem.status === 'rejected' ? (
                                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl">
                                        <h3 className="text-red-400 font-bold text-xl mb-3 flex items-center gap-2">
                                            <AlertCircle /> Analysis Aborted
                                        </h3>
                                        <p className="text-red-300/80 leading-relaxed text-lg">
                                            {selectedHistoryItem.message || "The input image failed neural validation standards."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid lg:grid-cols-5 gap-12">
                                        <div className="lg:col-span-3 space-y-6">
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Analyzed Image</h4>
                                            <div className="aspect-square lg:aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black/40 relative flex items-center justify-center shadow-inner">
                                                {historyImageLoading ? (
                                                    <div className="flex flex-col items-center gap-4 text-slate-500">
                                                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                                        <p className="text-sm font-bold animate-pulse">Retrieving from server...</p>
                                                    </div>
                                                ) : historyImageError ? (
                                                    <div className="text-center p-8 text-red-400 bg-red-500/5 w-full h-full flex flex-col items-center justify-center">
                                                        <AlertCircle size={48} className="mb-4 opacity-50" />
                                                        <p className="text-lg font-bold mb-1">
                                                            {selectedHistoryItem.image_filename ? 'Asset Missing' : 'Incomplete Fragment'}
                                                        </p>
                                                        <p className="text-sm text-red-300/50 max-w-xs">{historyImageError}</p>
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
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Medical Outcome</h4>
                                                        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-8 rounded-2xl">
                                                            <h5 className="text-emerald-400 font-black text-xl mb-2">Optimal Health</h5>
                                                            <p className="text-emerald-300/60 leading-relaxed">Neural analysis found no significant indicators of alopecia. Scalp density appears healthy.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Neural Intelligence</h4>
                                                        <div className="space-y-4">
                                                            {selectedHistoryItem.detections && selectedHistoryItem.detections.map((det, idx) => (
                                                                <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                                                    <div>
                                                                        <h5 className="font-black text-slate-100 text-lg">{det.class_name}</h5>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${det.confidence * 100}%` }} />
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-500 font-bold">COGNITION SCORE</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-2xl font-mono text-indigo-400 font-black">
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
            </main>

            <footer className="mt-20 py-10 text-center border-t border-white/10">
                <p className="text-slate-500 text-sm font-medium">
                    &copy; 2026 <span className="text-indigo-400">YOLOv8 Vision Intelligence</span>.
                    <span className="mx-3 opacity-20">|</span>
                    Secure Scalp Health Analysis
                </p>
            </footer>
        </div>
    );
};

export default App;
