import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, GraduationCap, ArrowRight, Loader2, Filter, X, CheckCircle2, Info, Calendar } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { debounce } from 'lodash'
import axios from 'axios'

const cityFilters = ['All', 'Karachi', 'Lahore', 'Islamabad']

const DermatologistSearch = () => {
  const navigate = useNavigate()
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

  const fetchDermatologists = async (searchParams = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchParams.name) params.append('name', searchParams.name)
      if (searchParams.city) params.append('city', searchParams.city)
      if (searchParams.specialty) params.append('specialty', searchParams.specialty)
      if (searchParams.keyword) params.append('keyword', searchParams.keyword)

      const response = await axios.get(`${apiUrl}/api/dermatologists/search?${params.toString()}`)
      setDermatologists(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch dermatologists. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDermatologists()
  }, [])

  const debouncedSearch = useCallback(
    debounce((term) => {
      fetchDermatologists({ name: term, ...filters })
    }, 500),
    [filters]
  )

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const applyFilters = () => {
    fetchDermatologists({ name: searchTerm, ...filters })
    setShowFilters(false)
  }

  const clearFilters = () => {
    const cleared = { city: '', specialty: '', keyword: '' }
    setFilters(cleared)
    fetchDermatologists({ name: searchTerm, ...cleared })
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 text-slate-900">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'Find Specialist' }]} />

      {/* 🔍 Search Bar at Top */}
      <Card className="mt-6 mb-4 border-2 border-slate-200 rounded-2xl p-2 bg-slate-100">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or keyword..."
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filters
            {(filters.city || filters.specialty || filters.keyword) && (
              <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full ring-1 ring-emerald-500">Active</span>
            )}
          </Button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Location (City)</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder="e.g. New York"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Specialty</label>
                <select
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Specialties</option>
                  <option value="Dermatologist">General Dermatology</option>
                  <option value="Cosmetic Dermatologist">Cosmetic</option>
                  <option value="Pediatric Dermatologist">Pediatric</option>
                  <option value="Dermatopathologist">Dermatopathology</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Keywords (Bio/Clinic)</label>
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  placeholder="e.g. Laser, MBBS, Clinic"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-50">
              <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* City Filters */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {cityFilters.map((city) => (
          <button
            key={city}
            onClick={() => setFilters({ ...filters, city: city === 'All' ? '' : city })}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all ${filters.city === city || (city === 'All' && filters.city === '')
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white border-slate-200 text-slate-600'
              }`}
          >
            {city}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-500">Searching for experts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchDermatologists()}>Try Again</Button>
        </div>
      ) : dermatologists.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-bold text-xl">No specialists found</p>
          <p className="text-gray-500">Try adjusting your filters or search term</p>
          <Button variant="ghost" className="mt-4" onClick={clearFilters}>Clear all filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dermatologists.map((doctor, index) => {
            const avatarUrl = doctor.profilePhoto
              ? `${apiUrl}/${doctor.profilePhoto.replace(/\\/g, '/')}`
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.fullName}`

            return (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group border-gray-100 flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={doctor.fullName}
                        className="w-16 h-16 rounded-full border-2 border-emerald-500 shadow-sm object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                        {doctor.fullName}
                      </h3>
                      <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex items-center text-xs text-gray-600 gap-2">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="truncate">{doctor.city}, {doctor.clinicName}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 gap-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{doctor.stats?.rating || '4.9'} • {doctor.yearsOfExperience} yrs exp.</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="font-black text-sm text-gray-900">PKR {doctor.consultationFee || 'N/A'}</p>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        {doctor.availability || 'Available'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-[10px] font-black uppercase tracking-widest border-2"
                      onClick={() => navigate(`/patient/dermatologist/${doctor._id}`)}
                    >
                      Profile
                    </Button>
                    <Button
                      className="flex-1 text-[10px] font-black uppercase tracking-widest bg-slate-900 hover:bg-emerald-600"
                      onClick={() => navigate(`/patient/appointment-booking`, { state: { doctorId: doctor._id } })}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Book Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DermatologistSearch
