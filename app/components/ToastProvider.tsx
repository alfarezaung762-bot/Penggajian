'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastContext = createContext<{ showToast: (message: string, type?: ToastType) => void }>({
  showToast: () => {}
})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const icons = {
    success: <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />,
    error: <AlertOctagon size={24} className="text-rose-400 shrink-0 animate-bounce" />,
    warning: <AlertTriangle size={24} className="text-amber-400 shrink-0" />,
    info: <Info size={24} className="text-blue-400 shrink-0" />
  }

  const styles = {
    success: 'bg-slate-900 text-emerald-100 border-2 border-emerald-500 shadow-emerald-950/30',
    error: 'bg-slate-900 text-rose-100 border-2 border-rose-500 shadow-rose-950/40 ring-4 ring-rose-500/20',
    warning: 'bg-slate-900 text-amber-100 border-2 border-amber-500 shadow-amber-950/30',
    info: 'bg-slate-900 text-blue-100 border-2 border-blue-500 shadow-slate-950/30'
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container — Prominent Top-Center Placement */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] space-y-3 max-w-lg w-[92vw] sm:w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles[t.type]} px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-6 fade-in duration-200 pointer-events-auto backdrop-blur-md`}
          >
            {icons[t.type]}
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">
                {t.type === 'error' ? 'Pemberitahuan / Kendala Absensi' : t.type === 'success' ? 'Berhasil' : 'Informasi'}
              </p>
              <p className="text-sm font-black text-white leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1.5 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
