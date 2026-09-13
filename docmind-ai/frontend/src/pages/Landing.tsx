import { Link } from 'react-router-dom'
import { Brain, Upload, MessageSquare, FileCheck, ArrowRight, Zap, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">DocMind AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap size={14} />
          Powered by RAG — Every answer is cited
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Turn Documents Into
          <span className="text-indigo-600"> Intelligence</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Upload PDFs, research papers, and reports. Ask questions in plain language.
          Get answers grounded in your documents — with source citations.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start for Free <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-500 mb-14">Three steps from document to insight</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Upload, step: '01', title: 'Upload', desc: 'Upload your PDF, DOCX, or TXT files. DocMind AI processes and indexes them automatically.' },
              { icon: MessageSquare, step: '02', title: 'Ask', desc: 'Ask any question in natural language. Semantic search finds the most relevant sections.' },
              { icon: FileCheck, step: '03', title: 'Verify', desc: 'Every answer includes the source document, page number, and relevant text. Trust, but verify.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="text-xs font-bold text-indigo-400 mb-2">{step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything You Need</h2>
        <p className="text-center text-gray-500 mb-14">Built for students, researchers, and professionals</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: MessageSquare, title: 'AI Chat', desc: 'Conversational interface to query your documents naturally.' },
            { icon: Search, title: 'Semantic Search', desc: 'Find information by meaning, not just keywords.' },
            { icon: FileCheck, title: 'Source Citations', desc: 'Every answer cites the exact page and section.' },
            { icon: Brain, title: 'Document Summary', desc: 'Instant quick and detailed summaries with key topics.' },
            { icon: Shield, title: 'Anti-Hallucination', desc: 'AI explicitly says when information is not in your documents.' },
            { icon: Zap, title: 'Multi-Document', desc: 'Ask questions across multiple documents simultaneously.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to make your documents intelligent?</h2>
          <p className="text-indigo-200 mb-8">Join and start getting cited answers from your documents today.</p>
          <Link to="/register">
            <Button size="lg" variant="outline" className="bg-white text-indigo-600 hover:bg-indigo-50 border-white">
              Get Started Free <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">DocMind AI</span>
          </div>
          <p className="text-sm text-gray-400">Turn Documents Into Intelligence.</p>
        </div>
      </footer>
    </div>
  )
}
