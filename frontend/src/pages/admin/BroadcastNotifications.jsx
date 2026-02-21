import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Users, Bell } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const BroadcastNotifications = () => {
  const addToast = useToastStore((state) => state.addToast)

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all',
  })

  const handleSend = () => {
    if (!formData.title || !formData.message) return

    addToast({
      type: 'success',
      title: 'Notification Sent',
      message: `Broadcast sent to ${formData.target === 'all'
          ? 'all users'
          : formData.target
        }`,
    })

    setFormData({ title: '', message: '', target: 'all' })
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Admin' }, { label: 'Broadcast Notifications' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Broadcast Notifications
        </h1>
        <p className="text-gray-600">
          Send system-wide announcements to patients and dermatologists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= FORM ================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Create Notification
              </h2>
            </div>

            <div className="space-y-5">
              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="patients">Patients Only</option>
                  <option value="dermatologists">Dermatologists Only</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. System Maintenance Update"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Write your notification message here..."
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={!formData.title || !formData.message}
                className="w-full py-3 text-base"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* ================= PREVIEW ================= */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="shadow-lg border border-gray-100 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">
                Live Preview
              </h3>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-2">
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium inline-block">
                {formData.target === 'all'
                  ? 'All Users'
                  : formData.target}
              </span>

              <h4 className="text-lg font-semibold text-gray-900">
                {formData.title || 'Notification title'}
              </h4>

              <p className="text-sm text-gray-600 whitespace-pre-line">
                {formData.message || 'Your message will appear here...'}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default BroadcastNotifications
