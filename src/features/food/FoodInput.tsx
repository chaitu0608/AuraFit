import { useState, useRef } from 'react'
import { Mic, MicOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { MealSlot } from '@/lib/food'

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
    SpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

export function FoodInput({
  slot,
  onParse,
  loading,
}: {
  slot: MealSlot
  onParse: (text: string) => Promise<void>
  loading?: boolean
}) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const handleSubmit = async () => {
    if (!text.trim() || loading) return
    await onParse(text.trim())
    setText('')
  }

  const hasVoice = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`What did you eat for ${slot}? e.g. 1 cup dal and 2 rotis`}
        rows={3}
        className="resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSubmit()
          }
        }}
      />
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1 gap-2"
          disabled={!text.trim() || loading}
          onClick={() => void handleSubmit()}
        >
          <Sparkles size={16} />
          {loading ? 'Parsing…' : 'Parse & log'}
        </Button>
        {hasVoice && (
          <Button
            type="button"
            variant="secondary"
            className="!px-3"
            aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            onClick={listening ? stopVoice : startVoice}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
        )}
      </div>
    </div>
  )
}
