import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, MapPin, Briefcase, Star, CheckCircle,
    FileText, Award, Building, Phone, Mail,
    Calendar, Shield, Loader2, Award as CertificateIcon,
    ChevronLeft, MessageCircle, Clock, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

const DermatologistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const addToast = useToastStore((state) => state.addToast);

    const [dermatologist, setDermatologist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchDermatologist = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/api/dermatologists/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setDermatologist(response.data);
            } catch (err) {
                console.error('Error fetching dermatologist details:', err);
                setError('Failed to load dermatologist details.');
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Could not fetch dermatologist information'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDermatologist();
    }, [id, token, apiUrl, addToast]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-500 animate-pulse text-lg">Loading expert profile...</p>
            </div>
        );
    }

    if (error || !dermatologist) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4 text-xl font-medium">{error || 'Dermatologist not found'}</p>
                <Button onClick={() => navigate('/patient/dermatologists')} variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Search
                </Button>
            </div>
        );
    }

    const avatarUrl = dermatologist.profilePhoto
        ? `${apiUrl}/${dermatologist.profilePhoto.replace(/\\/g, '/')}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${dermatologist.fullName}`;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <Breadcrumbs
                items={[
                    { label: 'Dermatologists', path: '/patient/dermatologists' },
                    { label: dermatologist.fullName }
                ]}
            />

            {/* Header Section */}
            <div className="relative mb-8 pt-12 md:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-50"
                >
                    <div className="h-40 bg-gradient-to-r from-emerald-500 to-teal-600 relative overflow-hidden">
                        {/* Abstract background shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16 blur-xl"></div>
                    </div>

                    <div className="px-8 pb-8">
                        <div className="relative flex flex-col md:flex-row items-end -mt-16 md:-mt-20 gap-6 mb-6">
                            <div className="relative group">
                                <img
                                    src={avatarUrl}
                                    alt={dermatologist.fullName}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-white shadow-2xl object-cover bg-white transform transition-transform group-hover:scale-[1.02]"
                                />
                                {dermatologist.verified && (
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white ring-4 ring-emerald-50">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left pt-2">
                                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{dermatologist.fullName}</h1>
                                    {dermatologist.verified && (
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Verified Specialist
                                        </span>
                                    )}
                                </div>
                                <p className="text-emerald-600 font-semibold text-lg flex items-center justify-center md:justify-start gap-2 mb-3">
                                    <Briefcase className="w-5 h-5" />
                                    {dermatologist.specialty || 'General Dermatology'}
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-600 text-sm">
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        <span>{dermatologist.city || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                        <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                        <span>{dermatologist.yearsOfExperience}+ Years Practice</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-emerald-700 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span>Fee: ${dermatologist.consultationFee || '0'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 md:pt-0">
                                <Button size="lg" className="rounded-2xl shadow-lg shadow-emerald-200" onClick={() => navigate('/patient/appointment-booking', { state: { doctorId: dermatologist._id } })}>
                                    Book Consultation
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-2xl border-emerald-200">
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Bio Section */}
                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-6 h-6 text-emerald-500" />
                            About Dermatologist
                        </h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                            {dermatologist.bio || "No professional bio provided yet."}
                        </p>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-50">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-50">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Award className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-0.5">Education</h4>
                                    <p className="text-sm text-gray-600">{dermatologist.qualifications || 'Specialized in Advanced Dermatology'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-teal-50/30 border border-teal-50">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Building className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-0.5">Clinic Affiliation</h4>
                                    <p className="text-sm text-gray-600">{dermatologist.clinicName || 'DermMate Partner Clinic'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{dermatologist.clinicAddress}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Certificates Section */}
                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-emerald-500" />
                            Verified Trust Documents
                        </h2>

                        {!dermatologist.verified || !dermatologist.certifications || dermatologist.certifications.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Wait for verification or no documents public yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dermatologist.certifications.map((cert, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-emerald-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate text-sm">{cert.split(/[\\/]/).pop()}</p>
                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Verified Document</span>
                                        </div>
                                        <a
                                            href={`${apiUrl}/${cert.replace(/\\/g, '/')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                                            title="Download / View"
                                        >
                                            <FileText className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <CertificateIcon className="w-8 h-8 text-emerald-600" />
                            <p className="text-xs text-emerald-800 leading-snug">
                                <span className="font-bold block mb-0.5">Professional Trust Guarantee</span>
                                DermMate verifies all medical licenses and degrees manually to ensure the highest standards of safety and accuracy.
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Statistics & Quick Info */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-emerald-500 overflow-hidden">
                        <div className="bg-emerald-500 p-6 text-white">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Expert Performance
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">Global Cases</p>
                                <p className="text-2xl font-bold text-gray-900">1.2k+</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">Experience</p>
                                <p className="text-2xl font-bold text-gray-900">{dermatologist.yearsOfExperience}y</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">Satisfaction</p>
                                <p className="text-2xl font-bold text-gray-900 font-mono">4.9/5</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">Availability</p>
                                <p className="text-sm font-bold text-emerald-600 uppercase pt-2">Available</p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 mt-2">
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[95%]"></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest font-bold">Platform Success Rate</p>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Contact & Location</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{dermatologist.clinicName || 'General Clinic'}</p>
                                    <p className="text-xs text-gray-500">{dermatologist.clinicAddress}, {dermatologist.city}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-emerald-500" />
                                <p className="text-sm text-gray-600">{dermatologist.phone}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-emerald-500" />
                                <p className="text-sm text-gray-600 truncate">{dermatologist.userId?.email || 'Dr_Contact@DermMate.com'}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Schedule</p>
                            <div className="flex items-center gap-2 text-emerald-700 font-medium">
                                <Calendar className="w-4 h-4" />
                                <span>{dermatologist.availability || 'Monday - Friday'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Licenses Section as requested */}
                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 p-6 bg-emerald-50/20">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-600" />
                            Dermatology Licenses
                        </h3>
                        <ul className="space-y-2">
                            <li className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Medical Practice License
                            </li>
                            <li className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Dermatology Specialization
                            </li>
                            <li className="text-sm text-gray-600 flex items-center gap-2 text-xs opacity-60">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Annual Registration 2024
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DermatologistDetail;
