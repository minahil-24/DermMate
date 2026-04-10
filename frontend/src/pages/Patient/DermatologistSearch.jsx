import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, GraduationCap, ArrowRight, Loader2, Filter, X, CheckCircle2, Info, Calendar } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import axios from 'axios'
import { mergeBooking } from '../../utils/bookingFlow'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { fetchCanBookDoctor } from '../../utils/canBookDoctor'

const cityFilters = ['All', 'Karachi', 'Lahore', 'Islamabad']

const DermatologistSearch = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { token } = useAuthStore()
    const addToast = useToastStore((s) => s.addToast)
    const draftCaseId = location.state?.draftCaseId
    const [dermatologists, setDermatologists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState({
        city: '',
        specialty: '',
        keyword: ''
    })
    const [showFilters, setShowFilters] = useState(false)

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

    const fetchDermatologists = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${apiUrl}/api/auth/doctors`)
            setDermatologists(response.data)
            setError(null)
        } catch (err) {
            setError('Failed to fetch experts. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDermatologists()
    }, [])

    const filteredDoctors = dermatologists.filter((doctor) => {
        const name = (doctor.name || '').toLowerCase()
        const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase())
        const loc = (doctor.location || '').toLowerCase()
        const city = (doctor.city || '').toLowerCase()
        const matchesCity =
            !filters.city ||
            loc.includes(filters.city.toLowerCase()) ||
            city.includes(filters.city.toLowerCase())
        const spec = (doctor.specialty || '').toLowerCase()
        const matchesSpecialty = !filters.specialty || spec.includes(filters.specialty.toLowerCase())
        const kw = (filters.keyword || '').toLowerCase()
        const matchesKeyword =
            !filters.keyword ||
            (doctor.bio && doctor.bio.toLowerCase().includes(kw)) ||
            (doctor.clinicName && doctor.clinicName.toLowerCase().includes(kw))
        return matchesSearch && matchesCity && matchesSpecialty && matchesKeyword
    })

    const getAvatar = (doc) => {
        if (doc.profilePhoto) return `${apiUrl}/${doc.profilePhoto.replace(/\\/g, '/')}`
        return doc.gender === 'female' ? '/imgs/default-female.png' : '/imgs/default-male.png'
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 text-slate-900">
            <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'Find Specialist' }]} />

            <div className="mt-8 mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Find a Specialist</h1>
                <p className="text-slate-500 font-medium">Connect with verified dermatology experts for professional care.</p>
                {!loading && !error && (
                    <p className="text-sm text-slate-600 mt-2">
                        Showing {filteredDoctors.length} of {dermatologists.length} dermatologist{dermatologists.length !== 1 ? 's' : ''} (all registered doctors are listed; use search or filters to narrow down).
                    </p>
                )}
            </div>

            <Card className="mb-8 border-none shadow-xl shadow-slate-100 rounded-3xl p-4 bg-white ring-1 ring-slate-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or clinic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-none bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium"
                        />
                    </div>
                    <Button
                        variant={showFilters ? 'primary' : 'outline'}
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 rounded-2xl px-6"
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </Button>
                </div>

                {showFilters && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 mt-6 border-t border-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Location</label>
                                <input 
                                    type="text" 
                                    value={filters.city} 
                                    onChange={(e) => setFilters({...filters, city: e.target.value})}
                                    placeholder="City name..."
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Specialty</label>
                                <select 
                                    value={filters.specialty} 
                                    onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                >
                                    <option value="">All Specialties</option>
                                    <option value="Dermatologist">General Dermatology</option>
                                    <option value="Cosmetic">Cosmetic</option>
                                    <option value="Pediatric">Pediatric</option>
                                </select>
                            </div>
                            <div className="space-y-2 flex items-end">
                                <Button variant="ghost" className="w-full" onClick={() => setFilters({city:'', specialty:'', keyword:''})}>Clear All</Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </Card>

            {draftCaseId && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <span className="font-semibold">Resending a draft:</span> choose a dermatologist, then schedule — your
                    questionnaire and images are reused.
                </div>
            )}

            <div className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-none">
                {cityFilters.map((city) => (
                    <button
                        key={city}
                        onClick={() => setFilters({ ...filters, city: city === 'All' ? '' : city })}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shrink-0 transition-all ${
                            (city === 'All' && filters.city === '') || filters.city === city
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
                        }`}
                    >
                        {city}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Finding doctors...</p>
                </div>
            ) : filteredDoctors.length === 0 ? (
                <Card className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-100">
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-900 font-black text-xl">No specialists match your search</p>
                    <p className="text-slate-400 mt-1">Try expanding your filters or check back later.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDoctors.map((doctor, index) => (
                        <motion.div
                            key={doctor._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="h-full hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 group border-none ring-1 ring-slate-100 rounded-3xl p-6 flex flex-col bg-white">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="relative">
                                        <img
                                            src={getAvatar(doctor)}
                                            alt={doctor.name}
                                            className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl shadow-slate-200 object-cover group-hover:scale-105 transition-transform"
                                        />
                                        {doctor.isDoctorVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md">
                                                <CheckCircle2 className="w-5 h-5 text-blue-500 fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors text-lg leading-tight">
                                            {doctor.name}
                                        </h3>
                                        <div className="text-[10px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded-lg inline-block mt-1">
                                            {doctor.specialty || 'Generalist'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-grow">
                                    <div className="flex items-center text-xs font-bold text-slate-500 gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500/50" />
                                        <span className="truncate">{doctor.location || doctor.city || 'Pakistan'}</span>
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-slate-500 gap-2">
                                        <GraduationCap className="w-4 h-4 text-emerald-500/50" />
                                        <span>{doctor.experience || '0'}+ Years Experience</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl mt-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Consultation</p>
                                            <p className="font-black text-slate-900">PKR {doctor.consultationFee || '500'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                                                {doctor.availability || 'Available'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] h-12"
                                        onClick={() => navigate(`/patient/dermatologist/${doctor._id}`, { state: draftCaseId ? { draftCaseId } : undefined })}
                                    >
                                        Profile
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 hover:bg-emerald-600 h-12"
                                        onClick={async () => {
                                            if (draftCaseId) {
                                                mergeBooking({
                                                    draftCaseId,
                                                    doctorId: doctor._id,
                                                })
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
                                                        const data = await fetchCanBookDoctor(
                                                            apiUrl,
                                                            token,
                                                            doctor._id
                                                        )
                                                        if (data && data.allowed === false) {
                                                            addToast({
                                                                type: 'error',
                                                                title: 'Cannot book',
                                                                message:
                                                                    data.message ||
                                                                    'You cannot start a new booking with this dermatologist right now.',
                                                            })
                                                            return
                                                        }
                                                    } catch (e) {
                                                        addToast({
                                                            type: 'error',
                                                            title: 'Could not verify',
                                                            message:
                                                                e.response?.data?.message ||
                                                                e.message ||
                                                                'Please try again.',
                                                        })
                                                        return
                                                    }
                                                }
                                                navigate('/patient/booking/complaint', {
                                                    state: { doctorId: doctor._id, doctorName: doctor.name },
                                                })
                                            }
                                        }}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DermatologistSearch
