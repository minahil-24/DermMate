import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

const Toast = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5" />,
            error: <AlertCircle className="w-5 h-5" />,
            warning: <AlertTriangle className="w-5 h-5" />,
            info: <Info className="w-5 h-5" />,
          }

          const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500',
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`${colors[toast.type] || colors.info} text-white rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px]`}
            >
              <div className="flex-shrink-0 mt-0.5">{icons[toast.type] || icons.info}</div>
              <div className="flex-1">
                {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
                <div className="text-sm">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default Toast
