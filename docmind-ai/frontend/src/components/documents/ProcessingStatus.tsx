import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { documentService } from '@/services/documentService'
import type { DocumentStatus } from '@/types/document'

interface ProcessingStatusProps {
  documentId: string
  initialStatus: DocumentStatus
  onReady?: () => void
}

const statusConfig = {
  UPLOADED:   { icon: Clock,       color: 'text-gray-500',   bg: 'bg-gray-100',   label: 'Uploaded' },
  PROCESSING: { icon: Loader2,     color: 'text-amber-600',  bg: 'bg-amber-50',   label: 'Processing...' },
  READY:      { icon: CheckCircle, color: 'text-emerald-600',bg: 'bg-emerald-50', label: 'Ready' },
  FAILED:     { icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50',     label: 'Failed' },
}

export default function ProcessingStatus({ documentId, initialStatus, onReady }: ProcessingStatusProps) {
  const [status, setStatus] = useState<DocumentStatus>(initialStatus)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useEffect(() => {
    if (status === 'READY' || status === 'FAILED') return

    const interval = setInterval(async () => {
      try {
        const result = await documentService.getStatus(documentId)
        setStatus(result.status as DocumentStatus)
        if (result.status === 'READY') {
          onReady?.()
          clearInterval(interval)
        } else if (result.status === 'FAILED') {
          clearInterval(interval)
        }
      } catch {
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [documentId, status, onReady])

  const config = statusConfig[status] || statusConfig.UPLOADED
  const Icon = config.icon

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bg, config.color
    )}>
      <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {config.label}
    </span>
  )
}
