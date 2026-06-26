import { useState, useRef } from 'react'
import { Mic, MicOff, Sparkles, ArrowUp } from 'lucide-react'
import type { MealSlot } from '@/lib/food'
import { hapticLight } from '@/lib/haptics'
import { useTapBurst } from '@/components/anime/hooks'

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
  const onTap = useTapBurst()

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
    void hapticLight()
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const handleSubmit = async () => {
    if (!text.trim() || loading) return
    void hapticLight()
    await onParse(text.trim())
    setText('')
  }

  const hasVoice = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  return (
    <div className="food-input-bar">
      <div className="relative flex items-end gap-2 rounded-r border border-line bg-surface2 p-2 shadow-glow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`I ate… (${slot})`}
          rows={2}
          className="flex-1 bg-transparent text-[15px] text-text placeholder:text-faint resize-none outline-none px-2 py-2 min-h-[44px] max-h-28"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSubmit()
            }
          }}
        />
        <div className="flex flex-col gap-1.5 pb-1">
          {hasVoice && (
            <button
              type="button"
              className="icon-btn !w-10 !h-10"
              aria-label={listening ? 'Stop voice' : 'Voice input'}
              onClick={listening ? stopVoice : startVoice}
            >
              {listening ? <MicOff size={18} className="text-accent" /> : <Mic size={18} />}
            </button>
          )}
          <button
            type="button"
            onPointerDown={onTap}
            disabled={!text.trim() || loading}
            onClick={() => void handleSubmit()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-ink disabled:opacity-40 shadow-glow-sm active:scale-90 transition-transform"
            aria-label="Parse food"
          >
            {loading ? (
              <Sparkles size={18} className="animate-pulse" />
            ) : (
              <ArrowUp size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-faint mt-2 px-1">
        Try: &quot;i ate a bowl of dal and 2 rotis&quot;
      </p>
    </div>
  )
}
