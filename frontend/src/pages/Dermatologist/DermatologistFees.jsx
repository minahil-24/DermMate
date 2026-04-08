import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Wallet, Loader2, Save } from 'lucide-react'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

const DermatologistFees = () => {
  const { token, user, updateUser } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fee, setFee] = useState(user?.consultationFee ?? '')
  const [slots, setSlots] = useState(user?.availabilitySlots || [])

  const ALL_SLOTS = useMemo(
    () => [
      '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
      '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
    ],
    []
  )

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setLoading(true)
        const res = await axios.get(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        updateUser(res.data)
        setFee(res.data?.consultationFee ?? '')
        setSlots(res.data?.availabilitySlots || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, apiUrl, updateUser])

  const toggleSlot = (t) => {
    setSlots((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()))
  }

  const save = async () => {
    try {
      setSaving(true)
      const res = await axios.patch(
        `${apiUrl}/api/auth/profile`,
        { consultationFee: fee === '' ? '' : Number(fee), availabilitySlots: slots },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.user) updateUser(res.data.user)
      addToast({ type: 'success', title: 'Saved', message: 'Consultation fee updated.' })
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Save failed',
        message: e.response?.data?.message || e.message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Fees' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultation Fee</h1>
        <p className="text-gray-600">This fee is shown to patients during booking and used in case submissions.</p>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current</p>
                <p className="font-semibold text-gray-900">PKR {user?.consultationFee ?? 'Not set'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Set new fee (PKR)</label>
              <input
                type="number"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g., 1500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Available time slots (30 min)</label>
              <p className="text-xs text-gray-500 mb-3">Patients will only see the slots you select here.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-xl">
                {ALL_SLOTS.map((t) => {
                  const on = slots.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSlot(t)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        on
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Selected: {slots.length}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving || !token} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default DermatologistFees

