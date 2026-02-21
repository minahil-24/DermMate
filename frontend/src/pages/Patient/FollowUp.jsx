import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, Camera, AlertCircle, CheckCircle2, ChevronRight, Plus, Image as ImageIcon } from 'lucide-react'
import Card from '../../components/ui/Card'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { useToastStore } from '../../store/toastStore'

const FollowUp = () => {
  const addToast = useToastStore((state) => state.addToast)
  const [uploadedImages, setUploadedImages] = useState([])

  const upcomingAppointment = {
    dermatologist: 'Dr. Sarah Johnson',
    date: 'January 15, 2026',
    time: '10:30 AM',
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, { file, preview: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
    addToast({
      type: 'success',
      title: 'Images Ready',
      message: `${files.length} clinical images added.`,
    })
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 text-slate-900 font-sans antialiased">
      <Breadcrumbs items={[{ label: 'Dashboard' }, { label: 'Pre-Visit Action' }]} />
      
      <header className="mt-8 mb-10 border-b-2 border-slate-100 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Action Required</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">FollowUps</h1>
        <p className="text-sm text-slate-500 font-medium">Pre-Visit Protocol: Documentation for {upcomingAppointment.dermatologist}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Compact Appointment Info */}
        <div className="lg:col-span-4">
          <Card className="border-2 border-slate-200 rounded-3xl p-6 bg-white shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <AlertCircle size={14} className="text-emerald-600" /> Visit Details
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <User size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Provider</p>
                  <p className="text-sm font-bold text-slate-900">{upcomingAppointment.dermatologist}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Calendar size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Schedule</p>
                  <p className="text-sm font-bold text-slate-900">{upcomingAppointment.date} at {upcomingAppointment.time}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[11px] font-bold text-emerald-800 leading-tight">
                Important: Upload images 24h before visit.
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Sleek Upload Area */}
        <div className="lg:col-span-8">
          <Card className="rounded-[2rem] border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={20} className="text-emerald-500" /> Clinical Images
              </h2>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-100">
                {uploadedImages.length} Ready
              </span>
            </div>
            
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                {uploadedImages.map((img, index) => (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} key={index} 
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm">
                    <img src={img.preview} alt="Upload" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="text-white" size={20} />
                    </div>
                  </motion.div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                  <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                  <Plus size={20} className="text-slate-400" />
                </label>
              </div>
            ) : (
              <label className="block mb-6 cursor-pointer group">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center group-hover:border-emerald-500 group-hover:bg-emerald-50/30 transition-all">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-600 transition-colors shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Click to Upload Progress</p>
                  <p className="text-xs text-slate-400">JPG or PNG supported</p>
                </div>
              </label>
            )}

            <button 
              disabled={uploadedImages.length === 0}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-300 transition-all hover:bg-emerald-600 active:scale-[0.98]"
            >
              Submit Documentation <ChevronRight size={14} />
            </button>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default FollowUp;