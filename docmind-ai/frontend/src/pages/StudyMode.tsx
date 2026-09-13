import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { GraduationCap, Loader2, ArrowLeft, BookOpen, CheckCircle, XCircle, RotateCcw, Clock, FlipVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { documentService } from '@/services/documentService'

interface MCQ {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface ShortQ { question: string; answer: string }
interface Flashcard { front: string; back: string }

type Tab = 'notes' | 'mcqs' | 'questions' | 'flashcards'

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'mcqs', label: 'MCQs', icon: CheckCircle },
  { key: 'questions', label: 'Questions', icon: GraduationCap },
  { key: 'flashcards', label: 'Flashcards', icon: FlipVertical },
]

const QUIZ_TIME_PER_QUESTION = 30

export default function StudyMode() {
  const { documentId } = useParams<{ documentId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [notes, setNotes] = useState('')
  const [mcqs, setMcqs] = useState<MCQ[]>([])
  const [shortQuestions, setShortQuestions] = useState<ShortQ[]>([])
  const [longQuestions, setLongQuestions] = useState<ShortQ[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [docName, setDocName] = useState('')

  // MCQ state
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [mcqScore, setMcqScore] = useState({ correct: 0, total: 0 })

  // Quiz timer
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_PER_QUESTION)
  const [timerActive, setTimerActive] = useState(false)

  // Flashcard state
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!documentId) return
    documentService.get(documentId).then((doc) => setDocName(doc.filename)).catch(() => {})
  }, [documentId])

  const generateStudyMaterial = async () => {
    if (!documentId) return
    setIsLoading(true)
    setError('')
    try {
      const result = await documentService.getStudyMaterial(documentId)
      setNotes(result.notes)
      setMcqs(result.mcqs)
      setShortQuestions(result.short_questions)
      setLongQuestions(result.long_questions)
      setFlashcards(result.flashcards)
    } catch {
      setError('Unable to generate study material. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Quiz timer
  useEffect(() => {
    if (!timerActive || activeTab !== 'mcqs' || mcqs.length === 0) return
    if (timeLeft <= 0) {
      handleMcqAnswer(null)
      return
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timerActive, timeLeft, activeTab, mcqs.length])

  const startQuiz = useCallback(() => {
    setCurrentMcqIndex(0)
    setSelectedOption(null)
    setShowExplanation(false)
    setMcqScore({ correct: 0, total: 0 })
    setTimeLeft(QUIZ_TIME_PER_QUESTION)
    setTimerActive(true)
  }, [])

  const handleMcqAnswer = (option: string | null) => {
    if (selectedOption !== null) return
    setSelectedOption(option)
    setTimerActive(false)
    setShowExplanation(true)
    const correct = option !== null && option === mcqs[currentMcqIndex]?.answer
    setMcqScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }))
  }

  const nextMcq = () => {
    if (currentMcqIndex < mcqs.length - 1) {
      setCurrentMcqIndex((i) => i + 1)
      setSelectedOption(null)
      setShowExplanation(false)
      setTimeLeft(QUIZ_TIME_PER_QUESTION)
      setTimerActive(true)
    }
  }

  const toggleFlashcard = (index: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-5 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to={`/documents/${documentId}`} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={18} />
            </Link>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Study Mode</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Study Material</h1>
          <p className="mt-2 text-gray-500">Generate notes, questions, and flashcards from {docName || 'your document'}</p>
        </div>
        <Button onClick={generateStudyMaterial} disabled={isLoading || !documentId} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
          {isLoading ? 'Generating...' : 'Generate Study Material'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!isLoading && !notes && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Generate Study Material</h2>
          <p className="text-gray-500 text-sm max-w-md">
            Click the button above to create notes, MCQs, questions, and flashcards from your document.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="h-12 w-64 rounded-lg bg-gray-100 shimmer" />
          <div className="h-48 rounded-xl bg-gray-100 shimmer" />
        </div>
      )}

      {(notes || mcqs.length > 0) && !isLoading && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <Card>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{notes}</div>
              </CardContent>
            </Card>
          )}

          {/* MCQs Tab */}
          {activeTab === 'mcqs' && mcqs.length > 0 && (
            <div className="space-y-4">
              {mcqs.length > 0 && mcqScore.total === 0 && !timerActive && selectedOption === null && currentMcqIndex === 0 && (
                <Button onClick={startQuiz} className="gap-2">
                  <Clock className="h-4 w-4" /> Start Quiz ({QUIZ_TIME_PER_QUESTION}s per question)
                </Button>
              )}

              {mcqScore.total > 0 && currentMcqIndex >= mcqs.length - 1 && selectedOption !== null && (
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900">Quiz Complete!</h3>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">
                      {mcqScore.correct} / {mcqScore.total}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {Math.round((mcqScore.correct / mcqScore.total) * 100)}% correct
                    </p>
                    <Button onClick={startQuiz} variant="outline" className="mt-4 gap-2">
                      <RotateCcw className="h-4 w-4" /> Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Question {currentMcqIndex + 1} of {mcqs.length}
                    </span>
                    <div className="flex items-center gap-3">
                      {timerActive && (
                        <span className={`text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                          {timeLeft}s
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        Score: {mcqScore.correct}/{mcqScore.total}
                      </span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900 mb-4">{mcqs[currentMcqIndex]?.question}</p>
                  <div className="space-y-2">
                    {mcqs[currentMcqIndex]?.options.map((option) => {
                      const letter = option.charAt(0)
                      const isCorrect = letter === mcqs[currentMcqIndex]?.answer
                      const isSelected = letter === selectedOption
                      let bg = 'bg-white border-gray-200 hover:bg-gray-50'
                      if (showExplanation && isCorrect) bg = 'bg-emerald-50 border-emerald-300'
                      else if (showExplanation && isSelected && !isCorrect) bg = 'bg-red-50 border-red-300'
                      return (
                        <button
                          key={option}
                          onClick={() => handleMcqAnswer(letter)}
                          disabled={selectedOption !== null}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${bg}`}
                        >
                          {option}
                          {showExplanation && isCorrect && <CheckCircle className="inline ml-2 h-4 w-4 text-emerald-600" />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="inline ml-2 h-4 w-4 text-red-600" />}
                        </button>
                      )
                    })}
                  </div>
                  {showExplanation && mcqs[currentMcqIndex]?.explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-800">
                      <strong>Explanation:</strong> {mcqs[currentMcqIndex].explanation}
                    </div>
                  )}
                  {selectedOption !== null && currentMcqIndex < mcqs.length - 1 && (
                    <Button onClick={nextMcq} className="mt-4 gap-2">
                      Next Question →
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Short/Long Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {shortQuestions.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Short Answer Questions</h3>
                    <div className="space-y-4">
                      {shortQuestions.map((q, i) => (
                        <ShortAnswerCard key={i} question={q.question} answer={q.answer} index={i} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {longQuestions.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Long Answer Questions</h3>
                    <div className="space-y-4">
                      {longQuestions.map((q, i) => (
                        <ShortAnswerCard key={i} question={q.question} answer={q.answer} index={i} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && flashcards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => toggleFlashcard(i)}
                  className={`text-left p-5 rounded-xl border-2 transition-all min-h-[180px] flex flex-col justify-center ${
                    flippedCards.has(i)
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  {flippedCards.has(i) ? (
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-2">Definition</p>
                      <p className="text-sm text-gray-800">{card.back}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">Term</p>
                      <p className="text-base font-semibold text-gray-900">{card.front}</p>
                      <p className="mt-3 text-xs text-gray-400">Click to reveal</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ShortAnswerCard({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [show, setShow] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="font-medium text-gray-900 text-sm">Q{index + 1}. {question}</p>
      <button
        onClick={() => setShow(!show)}
        className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
      >
        {show ? 'Hide Answer' : 'Show Answer'}
      </button>
      {show && (
        <div className="mt-2 p-3 rounded-lg bg-emerald-50 text-sm text-emerald-800">
          {answer}
        </div>
      )}
    </div>
  )
}
