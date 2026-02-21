import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scissors, Heart, Hand } from 'lucide-react'

// Then use `Target` or any other icon for Hair/Nails
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'

const ComplaintSelection = () => {
  const [selectedType, setSelectedType] = useState(null)
  const navigate = useNavigate()

  const complaintTypes = [
    {
      id: 'hair',
      name: 'Hair',
      icon: Scissors, // use the imported icon
      description: 'Hair loss, scalp conditions, alopecia',
      color: 'from-emerald-500 to-teal-600',
      examples: ['Androgenetic alopecia', 'Alopecia areata', 'Scalp conditions'],
    },
    {
      id: 'skin',
      name: 'Skin',
      icon: Heart, // you already imported Heart
      description: 'Skin conditions, rashes, acne',
      color: 'from-blue-500 to-cyan-600',
      examples: ['Acne', 'Eczema', 'Psoriasis', 'Melanoma'],
    },
    {
      id: 'nails',
      name: 'Nails',
      icon: Hand, // or another icon you prefer
      description: 'Nail disorders, infections',
      color: 'from-purple-500 to-pink-600',
      examples: ['Nail fungus', 'Nail psoriasis', 'Ingrown nails'],
    },
  ]


  const handleContinue = () => {
    if (selectedType) {
      if (selectedType === 'hair') {
        navigate('/patient/alopecia-detection', { state: { complaintType: selectedType } })
      } else {
        navigate('/patient/questionnaire', { state: { complaintType: selectedType } })
      }
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'New Complaint', link: '/patient/complaint' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Complaint Type</h1>
        <p className="text-gray-600">Choose the area of concern to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {complaintTypes.map((type, index) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card
                hover
                onClick={() => setSelectedType(type.id)}
                className={`cursor-pointer border-2 transition-all ${isSelected
                    ? 'border-emerald-500 shadow-lg scale-105'
                    : 'border-transparent hover:border-emerald-200'
                  }`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600 text-center mb-4">{type.description}</p>
                <div className="space-y-1">
                  {type.examples.map((example) => (
                    <div key={example} className="text-xs text-gray-500 text-center">
                      • {example}
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-4 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      <span>Selected</span>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          size="lg"
        >
          Continue to Questionnaire
        </Button>
      </div>
    </div>
  )
}

export default ComplaintSelection
