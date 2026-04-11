import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Send, Loader2 } from 'lucide-react'
import axios from 'axios'
import Button from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const HelpModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { token } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject || !message) {
      addToast({ type: 'error', title: 'Error', message: 'Subject and message are required.' })
      return
    }

    try {
      setIsSubmitting(true)
      await axios.post(`${apiUrl}/api/support/query`,
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      addToast({ type: 'success', title: 'Query Sent', message: 'Your support query has been sent to minahilsharif28@gmail.com' })
      setIsOpen(false)
      setSubject('')
      setMessage('')
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to Send', message: error.response?.data?.message || 'Check your connection or email config.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all z-40 group"
        title="Help & Support"
      >
        <HelpCircle className="w-8 h-8" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-sm rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Support Query
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  Contact Support
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Send us a query and our admin team (minahilsharif28@gmail.com) will get back to you soon.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="Briefly describe your issue..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-y"
                    placeholder="How can we help you?"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? 'Sending...' : 'Send Query'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default HelpModal
