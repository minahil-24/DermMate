import { motion } from 'framer-motion'
import { MapPin, Star, Phone, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { mockClinics } from '../../mock-data/clinics'

const ClinicsDiscovery = () => {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Clinics' }]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Clinics</h1>
        <p className="text-gray-600">Find nearby dermatology clinics and centers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClinics.map((clinic, index) => (
          <motion.div
            key={clinic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <img
                src={clinic.image}
                alt={clinic.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{clinic.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{clinic.rating}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{clinic.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{clinic.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{clinic.distance} away</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {clinic.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Hours</span>
                </div>
                <p className="text-xs text-gray-600">Weekdays: {clinic.hours.weekdays}</p>
                <p className="text-xs text-gray-600">Saturday: {clinic.hours.saturday}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ClinicsDiscovery
