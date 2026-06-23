import { Ban } from 'lucide-react'

const DeactivatedAccountBanner = () => (
  <div className="mb-6 p-4 rounded-2xl border-2 border-red-200 bg-red-50 flex items-start gap-3">
    <Ban className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
    <div>
      <p className="font-bold text-red-800">Your account has been deactivated</p>
      <p className="text-sm text-red-700 mt-1">
        You can view your appointment list below, but you cannot accept cases, manage patients, or
        perform other clinical actions. Please contact the DermMate administrator to restore your account.
      </p>
    </div>
  </div>
)

export default DeactivatedAccountBanner
