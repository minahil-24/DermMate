import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, Calendar, Clock, Info, BadgeCheck, Map } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { debounce } from '../../utils/helpers'

const mockDermatologists = [
  {
    id: '1',
    name: 'Dr. Ayesha Khan',
    specialization: 'Cosmetic Dermatology',
    rating: 4.9,
    totalReviews: 210,
    experience: 11,
    fee: 3000,
    availability: 'Today',
    mode: 'Physical + Online',
    hospital: 'Ziauddin Hospital',
    location: { city: 'Karachi', area: 'Clifton' },
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: '2',
    name: 'Dr. Hamza Malik',
    specialization: 'Medical Dermatology',
    rating: 4.8,
    totalReviews: 180,
    experience: 14,
    fee: 2500,
    availability: 'Tomorrow',
    mode: 'Physical',
    hospital: 'Shaukat Khanum',
    location: { city: 'Lahore', area: 'Gulberg' },
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: '3',
    name: 'Dr. Zainab Noor',
    specialization: 'Pediatric Dermatology',
    rating: 4.7,
    totalReviews: 140,
    experience: 9,
    fee: 2000,
    availability: 'Today',
    mode: 'Online',
    hospital: 'Shifa International',
    location: { city: 'Islamabad', area: 'F-7' },
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200',
  },
]

const cityFilters = ['All', 'Karachi', 'Lahore', 'Islamabad']

const DermatologistSearch = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCity, setActiveCity] = useState('All')
  const [filteredDermatologists, setFilteredDermatologists] = useState(mockDermatologists)
  const navigate = useNavigate()

  const handleSearch = debounce((value, city) => {
    let filtered = mockDermatologists.filter(
      (doc) =>
        doc.name.toLowerCase().includes(value.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(value.toLowerCase()) ||
        doc.location.city.toLowerCase().includes(value.toLowerCase())
    )

    if (city !== 'All') {
      filtered = filtered.filter((doc) => doc.location.city === city)
    }

    setFilteredDermatologists(filtered)
  }, 300)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    handleSearch(value, activeCity)
  }

  const handleCityFilter = (city) => {
    setActiveCity(city)
    handleSearch(searchTerm, city)
  }

 const handleBookAppointment = () => {
  navigate('/patient/complaint')
}

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 text-slate-900">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'Find Specialist' }]} />

      {/* 🔍 Search Bar at Top */}
      <Card className="mt-6 mb-4 border-2 border-slate-200 rounded-2xl p-2 bg-slate-100">
        <div className="relative bg-white rounded-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search doctor, city, or specialization..."
            className="w-full pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none border-none font-medium"
          />
        </div>
      </Card>

      {/* City Filters */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {cityFilters.map((city) => (
          <button
            key={city}
            onClick={() => handleCityFilter(city)}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all ${
              activeCity === city
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* 🗺️ Map / Distribution Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Map className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold">Dermatologists Across Pakistan</h2>
        </div>

        <Card className="relative overflow-hidden rounded-[2rem] h-56 border-2 border-slate-100">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
            alt="Pakistan Map"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
            <p className="text-white font-bold text-lg">Available in Major Cities</p>
            <p className="text-emerald-300 text-xs font-black uppercase tracking-widest">
              Karachi • Lahore • Islamabad
            </p>
          </div>
        </Card>
      </div>

      {/* ⭐ Recommendations */}
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-4 h-4 text-emerald-500" />
        <h2 className="text-xl font-bold">Recommended Dermatologists</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDermatologists.map((dermatologist, index) => (
          <motion.div
            key={dermatologist.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-2 border-slate-100 rounded-3xl p-6 bg-white hover:border-emerald-500 transition-all">
              <div className="flex gap-4 mb-4">
                <img
                  src={dermatologist.avatar}
                  alt={dermatologist.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div>
                  <h3 className="font-bold">{dermatologist.name}</h3>
                  <p className="text-xs uppercase text-slate-400 font-black">
                    {dermatologist.specialization}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold">{dermatologist.rating}</span>
                    <span className="text-[10px] text-slate-400">
                      ({dermatologist.totalReviews})
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  {dermatologist.location.area}, {dermatologist.location.city}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  {dermatologist.experience} Years Experience
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BadgeCheck className="w-3 h-3 text-emerald-500" />
                  {dermatologist.hospital}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <p className="font-black text-sm">PKR {dermatologist.fee}</p>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                  {dermatologist.availability}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
                  onClick={() => navigate(`/dermatologist/${dermatologist.id}`)}
                >
                  Profile
                </Button>
                <Button
                  className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 hover:bg-emerald-600"
                  onClick={() => handleBookAppointment(dermatologist.id)}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Book Now
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDermatologists.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mt-10">
          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No Specialists Found</h3>
          <p className="text-sm text-slate-400">Try searching another city</p>
        </div>
      )}
    </div>
  )
}

export default DermatologistSearch
