import { useEffect, useRef, useState } from 'react'
import { getHeartRateForRange } from '@/lib/healthkit'

export function HeartRateSparkline({ start, end }: { start: string; end: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [avg, setAvg] = useState<number | null>(null)

  useEffect(() => {
    getHeartRateForRange(start, end).then((samples) => {
      if (!samples.length || !canvasRef.current) return
      const values = samples.map((s) => s.value)
      setAvg(Math.round(values.reduce((a, b) => a + b, 0) / values.length))
      const cv = canvasRef.current
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const w = cv.width
      const h = cv.height
      const max = Math.max(...values)
      const min = Math.min(...values)
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = '#FF6A3D'
      ctx.lineWidth = 2
      ctx.beginPath()
      values.forEach((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    })
  }, [start, end])

  return (
    <div className="card mb-3">
      <div className="text-xs text-muted mb-2">Heart rate (Apple Watch)</div>
      <canvas ref={canvasRef} width={300} height={60} className="w-full h-[60px]" />
      {avg != null && <div className="text-sm text-muted mt-1">Avg {avg} bpm</div>}
    </div>
  )
}
