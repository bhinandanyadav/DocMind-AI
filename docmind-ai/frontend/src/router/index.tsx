import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Documents from '@/pages/Documents'
import Chat from '@/pages/Chat'
import DocumentDetails from '@/pages/DocumentDetails'
import DocumentViewer from '@/pages/DocumentViewer'
import Search from '@/pages/Search'
import Compare from '@/pages/Compare'
import Research from '@/pages/Research'
import ResearchMode from '@/pages/ResearchMode'
import Study from '@/pages/Study'
import StudyMode from '@/pages/StudyMode'
import Settings from '@/pages/Settings'
import AppLayout from '@/layouts/AppLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading DocMind AI...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:documentId" element={<DocumentDetails />} />
        <Route path="/documents/:documentId/view" element={<DocumentViewer />} />
        <Route path="/documents/:documentId/research" element={<ResearchMode />} />
        <Route path="/documents/:documentId/study" element={<StudyMode />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/search" element={<Search />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/research" element={<Research />} />
        <Route path="/research/:documentId" element={<ResearchMode />} />
        <Route path="/study" element={<Study />} />
        <Route path="/study/:documentId" element={<StudyMode />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-500">Page not found</p>
          <a href="/" className="text-indigo-600 hover:underline">Go home</a>
        </div>
      } />
    </Routes>
  )
}
