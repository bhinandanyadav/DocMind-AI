import { useEffect, useState } from 'react'
import { FileText, BookOpen, MessageSquare, Upload, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { documentService } from '@/services/documentService'

interface Stats {
  document_count: number
  total_pages: number
  question_count: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ document_count: 0, total_pages: 0, question_count: 0 })

  useEffect(() => {
    documentService.getStats().then(setStats).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Documents', value: stats.document_count, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Pages', value: stats.total_pages, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Questions Asked', value: stats.question_count, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your documents.</p>
        </div>
        <Link to="/documents">
          <Button className="gap-2"><Upload size={16} /> Upload Document</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Documents</h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No documents yet</p>
              <p className="text-xs text-gray-400 mb-4">Upload your first document to get started</p>
              <Link to="/documents">
                <Button size="sm" variant="outline" className="gap-1.5">Upload Document <ArrowRight size={14} /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Conversations</h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400 mb-4">Start chatting with your documents</p>
              <Link to="/chat">
                <Button size="sm" variant="outline" className="gap-1.5">Start Chat <ArrowRight size={14} /></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
