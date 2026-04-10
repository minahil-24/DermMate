import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    User, MapPin, Briefcase, Star, CheckCircle,
    FileText, Award, Building, Phone, Mail,
    Calendar, Shield, Loader2, Award as CertificateIcon,
    ChevronLeft, MessageCircle, Clock, TrendingUp, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getCertPath, getCertStatus } from '../../utils/certificates';
import { mergeBooking } from '../../utils/bookingFlow';
import { fetchCanBookDoctor } from '../../utils/canBookDoctor';

const DermatologistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const draftCaseId = location.state?.draftCaseId;
    const { token } = useAuthStore();
    const addToast = useToastStore((state) => state.addToast);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/api/auth/users/${id}`);
                setDoctor(response.data);
            } catch (err) {
                console.error('Error fetching expert details:', err);
                setError('Failed to load doctor profile.');
                addToast({
                    type: 'error',
                    title: 'Load Error',
                    message: 'Could not fetch information'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDoctor();
    }, [id, apiUrl, addToast]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading expert profile...</p>
            </div>
        );
    }

    if (error || !doctor) {
        return (
            <div className="max-w-xl mx-auto text-center py-24 bg-white rounded-3xl shadow-xl mt-12 p-12">
                <Shield className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Expert Not Found</h2>
                <p className="text-slate-500 mb-8 font-medium">The requested professional profile might have been moved or removed.</p>
                <Button onClick={() => navigate('/patient/dermatologists')} className="bg-slate-900 rounded-2xl w-full h-14 font-black uppercase tracking-widest">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Experts
                </Button>
            </div>
        );
    }

    const avatarUrl = doctor.profilePhoto
        ? `${apiUrl}/${doctor.profilePhoto.replace(/\\/g, '/')}`
        : (doctor.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png');

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <Breadcrumbs
                items={[
                    { label: 'Specialists', path: '/patient/dermatologists' },
                    { label: doctor.name }
                ]}
            />

            {/* Profile Hero */}
            <div className="mt-8 mb-12">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative">
                    <div className="h-64 bg-slate-900 rounded-t-[3rem] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/50 via-slate-900/50 border-b border-white/10" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-1 bg-white/5 blur-xl" />
                    </div>

                    <div className="bg-white rounded-b-[3rem] px-8 pb-12 shadow-2xl shadow-slate-200 relative -mt-32 ring-1 ring-slate-100">
                        <div className="flex flex-col md:flex-row items-end gap-8 pt-8">
                            <div className="relative group">
                                <img
                                    src={avatarUrl}
                                    alt={doctor.name}
                                    className="w-48 h-48 rounded-[2.5rem] border-8 border-white shadow-2xl object-cover"
                                />
                                {doctor.isDoctorVerified && (
                                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-3 rounded-2xl shadow-xl ring-4 ring-white">
                                        <CheckCircle className="w-6 h-6 fill-white text-blue-500" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 pb-4 text-center md:text-left">
                                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-2">
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{doctor.name}</h1>
                                    {doctor.isDoctorVerified && (
                                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 border border-emerald-100">
                                            Verified Expert
                                        </span>
                                    )}
                                </div>
                                <p className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-6">
                                    <Briefcase className="w-4 h-4" /> {doctor.specialty || 'Dermatology Resident'}
                                </p>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-tighter">
                                        <MapPin className="w-4 h-4 text-emerald-500" /> {doctor.location || doctor.city || 'Karachi'}
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-tighter">
                                        <Clock className="w-4 h-4 text-emerald-500" /> {doctor.experience || '0'} Years Exp.
                                    </div>
                                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-tighter">
                                        Fee: PKR {doctor.consultationFee || '500'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pb-4">
                                <Button size="lg" className="rounded-2xl px-12 bg-slate-900 shadow-xl shadow-slate-200 h-16 font-black uppercase tracking-widest text-xs" onClick={async () => {
                                    if (draftCaseId) {
                                        mergeBooking({ draftCaseId, doctorId: doctor._id })
                                        navigate('/patient/booking/schedule', {
                                            state: {
                                                doctorId: doctor._id,
                                                doctorName: doctor.name,
                                                draftCaseId,
                                                bookingFlow: true,
                                            },
                                        })
                                    } else {
                                        if (token) {
                                            try {
                                                const data = await fetchCanBookDoctor(apiUrl, token, doctor._id);
                                                if (data && data.allowed === false) {
                                                    addToast({
                                                        type: 'error',
                                                        title: 'Cannot book',
                                                        message: data.message || 'You cannot start a new booking with this dermatologist right now.',
                                                    });
                                                    return;
                                                }
                                            } catch (e) {
                                                addToast({
                                                    type: 'error',
                                                    title: 'Could not verify',
                                                    message: e.response?.data?.message || e.message || 'Please try again.',
                                                });
                                                return;
                                            }
                                        }
                                        navigate('/patient/booking/complaint', { state: { doctorId: doctor._id, doctorName: doctor.name } })
                                    }
                                }}>
                                    Book appointment
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 ring-1 ring-slate-100 p-10">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <User className="w-8 h-8 text-emerald-500" />
                            Clinical Profile
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed text-lg italic whitespace-pre-wrap">
                            {doctor.bio || "This specialist has not provided a detailed professional biography yet. Please contact the clinic for more information regarding their specific focus areas."}
                        </p>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-emerald-500" /> Academic Credentials
                                </h4>
                                <p className="text-slate-600 font-bold">{doctor.degree || 'MBBS, Specialized in Dermatology'}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-emerald-500" /> Primary Practice
                                </h4>
                                <p className="text-slate-600 font-bold">{doctor.clinicName || 'DermMate Affiliated Clinic'}</p>
                                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">{doctor.clinicAddress || 'Location provided upon booking'}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 ring-1 ring-slate-100 p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-emerald-500" />
                                Verified Credentials
                            </h2>
                            {doctor.isDoctorVerified && (
                                <span className="bg-emerald-500 text-white p-2 rounded-xl">
                                    <CheckCircle className="w-5 h-5 fill-white" />
                                </span>
                            )}
                        </div>

                        {!doctor.isDoctorVerified ? (
                            <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Shield className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Credentials Pending Admin Verification</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(() => {
                                    const verifiedOnly = (doctor.certifications || []).filter(
                                        (c) => getCertStatus(c) === 'verified'
                                    );
                                    return verifiedOnly.length > 0 ? (
                                    <div className="space-y-4">
                                        {verifiedOnly.map((cert, idx) => {
                                            const path = getCertPath(cert);
                                            return (
                                            <div key={idx} className="flex items-center gap-4 p-5 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm group hover:ring-emerald-200 transition-all">
                                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                                    <FileText className="w-7 h-7 text-emerald-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Medical Credential #{idx + 1}</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Verified Expert Document</p>
                                                </div>
                                                <a 
                                                    href={`${apiUrl}/${path.replace(/\\/g, '/')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="p-3 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            </div>
                                            )
                                        })}
                                    </div>
                                    ) : null;
                                })()}
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                                    <CertificateIcon className="w-8 h-8 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="font-black text-emerald-900 text-sm uppercase mb-1">Authenticity Guaranteed</p>
                                        <p className="text-xs text-emerald-700 font-medium italic border-l-2 border-emerald-200 pl-4 mt-2">
                                            DermMate's verification department has manually cross-referenced this specialist's identifiers with the National Medical Register.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="rounded-[2.5rem] border-none bg-emerald-600 p-8 shadow-2xl shadow-emerald-100 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-32 h-32" />
                        </div>
                        <h3 className="text-xl font-black mb-1 flex items-center gap-2 relative z-10">
                            Expert Statistics
                        </h3>
                        <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-8 relative z-10">On-Platform Performance</p>
                        
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-200/60 tracking-widest mb-1">Global Cases</p>
                                <p className="text-3xl font-black">1.5k+</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-200/60 tracking-widest mb-1">Experience</p>
                                <p className="text-3xl font-black">{doctor.experience || '0'}y</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-200/60 tracking-widest mb-1">Rating</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-3xl font-black">4.9</p>
                                    <Star className="w-4 h-4 fill-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-200/60 tracking-widest mb-1">Recovery</p>
                                <p className="text-3xl font-black">98%</p>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10">
                            <div className="bg-white/20 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest">Next Available</span>
                                <span className="text-xs font-bold bg-white text-emerald-700 px-3 py-1 rounded-lg">Today</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl ring-1 ring-slate-100 p-8 flex flex-col gap-6">
                        <h3 className="font-black text-slate-900 border-b border-slate-50 pb-4 uppercase text-xs tracking-widest">Practice Information</h3>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Primary Practice</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{doctor.clinicName || 'Expert Dermatology Center'}</p>
                                    <p className="text-xs text-slate-500 italic mt-1">{doctor.clinicAddress || 'Address details confirmed upon booking.'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Contact Line</p>
                                    <p className="text-sm font-bold text-slate-900">{doctor.phoneNumber || 'Via DermMate Concierge'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Professional Email</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{doctor.email}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DermatologistDetail;
