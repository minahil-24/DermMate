import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'

import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'

import { mockDermatologists } from '../../mock-data/dermatologists'
import { useToastStore } from '../../store/toastStore'

/* ---------------- MOCK PATIENT ---------------- */
const mockPatient = {
  id: 'p1',
  name: 'Ali Khan',
  email: 'alikhan@gmail.com',
  phone: '+92 300 1234567',
  age: 25,
  gender: 'Male',
  address: 'Lahore, Pakistan',
}

/* ---------------- PDF GENERATOR ---------------- */
const generatePDF = ({ patient, dermatologist, paymentMethod }) => {
  const doc = new jsPDF('p', 'pt', 'a4')

  // Professional styling
  const lineHeight = 20
  let y = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('Appointment Receipt', 40, y)

  y += lineHeight * 2
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Details', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${patient.name}`, 40, y)
  y += lineHeight
  doc.text(`Email: ${patient.email}`, 40, y)
  y += lineHeight
  doc.text(`Phone: ${patient.phone}`, 40, y)
  y += lineHeight
  doc.text(`Age: ${patient.age}`, 40, y)
  y += lineHeight
  doc.text(`Gender: ${patient.gender}`, 40, y)
  y += lineHeight
  doc.text(`Address: ${patient.address}`, 40, y)

  y += lineHeight
  doc.setFont('helvetica', 'bold')
  doc.text('Dermatologist Details', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${dermatologist.name}`, 40, y)
  y += lineHeight
  doc.text(`Specialization: ${dermatologist.specialization}`, 40, y)
  y += lineHeight
  doc.text(`Email: ${dermatologist.email}`, 40, y)
  y += lineHeight
  doc.text(`Phone: ${dermatologist.phone}`, 40, y)
  y += lineHeight
  doc.text(`Experience: ${dermatologist.experience} years`, 40, y)
  y += lineHeight
  doc.text(`Clinic: ${dermatologist.location.address}`, 40, y)

  y += lineHeight
  doc.setFont('helvetica', 'bold')
  doc.text('Appointment & Payment', 40, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: ${paymentMethod}`, 40, y)
  y += lineHeight
  doc.text(`Status: Paid`, 40, y)

  // Optional: Draw a line at bottom
  doc.setLineWidth(0.5)
  doc.line(40, y + 20, 555, y + 20)

  doc.save('appointment_receipt.pdf')
}

const Payment = () => {
  const location = useLocation()
  const addToast = useToastStore((state) => state.addToast)

  const dermatologistId = location.state?.appointment?.dermatologistId || '1'
  const dermatologist =
    mockDermatologists.find((d) => d.id === dermatologistId) ||
    mockDermatologists[0]

  const [paymentStatus, setPaymentStatus] = useState('Pending')

  const handlePayment = (method) => {
    setPaymentStatus('Paid')

    addToast({
      type: 'success',
      title: 'Payment Successful',
      message: `Paid via ${method}`,
    })

    // Generate PDF receipt immediately
    generatePDF({ patient: mockPatient, dermatologist, paymentMethod: method })
  }

  const paymentOptions = [
    {
      name: 'JazzCash',
      logo: 'data:image/png;base64,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',
    },
    {
      name: 'EasyPaisa',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRh2kRJ_wgX00WW5tJ5CKaTqi52Qga3E-Vs6g&s',
    
    },
    {
      name: 'Pay at Clinic',
      logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // generic clinic icon
    },
  ]

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Find Dermatologist', link: '/patient/dermatologists' },
          { label: 'Payment' },
        ]}
      />

      <h1 className="text-3xl font-bold mb-6">Payment Options</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paymentOptions.map((option) => (
          <motion.div
            key={option.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <Card
              onClick={() => handlePayment(option.name)}
              className="flex flex-col items-center justify-center p-6 hover:shadow-2xl transition-shadow"
            >
              <img
                src={option.logo}
                alt={option.name}
                className="w-20 h-20 mb-4 object-contain"
              />
              <h3 className="text-xl font-semibold">{option.name}</h3>
            </Card>
          </motion.div>
        ))}
      </div>

      {paymentStatus === 'Paid' && (
        <div className="mt-6 text-center text-green-600 font-semibold">
          Payment Completed! PDF Receipt downloaded.
        </div>
      )}
    </div>
  )
}

export default Payment
