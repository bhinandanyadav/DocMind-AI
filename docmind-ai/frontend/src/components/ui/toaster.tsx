import { useToast } from '@/hooks/useToast'

export function Toaster() {
  const { toasts } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg bg-white animate-in slide-in-from-bottom-2 ${
            toast.variant === 'destructive'
              ? 'border-red-200 border-l-4 border-l-red-500'
              : 'border-gray-200 border-l-4 border-l-indigo-500'
          }`}
        >
          <div className="flex-1">
            {toast.title && <p className="text-sm font-semibold text-gray-900">{toast.title}</p>}
            {toast.description && <p className="text-sm text-gray-500 mt-0.5">{toast.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
