import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'

const CJK_RE = /[一-鿿㐀-䶿]/

function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  )
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.dataset.theme === 'dark')
    })
    obs.observe(document.documentElement, { attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

function CharWriter({ char, isDark }: { char: string; isDark: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    el.innerHTML = ''

    const size = el.clientWidth || 96
    const style = getComputedStyle(document.documentElement)
    const strokeColor = style.getPropertyValue('--text').trim()
    const outlineColor = style.getPropertyValue('--border').trim()

    const writer = HanziWriter.create(el, char, {
      width: size,
      height: size,
      padding: Math.round(size * 0.09),
      strokeColor,
      outlineColor,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      showCharacter: true,
    })
    writerRef.current = writer

    return () => {
      writer.pauseAnimation()
    }
  }, [char, isDark])

  return (
    <div
      ref={wrapRef}
      className="stroke-char-wrap"
      onClick={() => writerRef.current?.animateCharacter()}
      role="button"
      aria-label={`Stroke order for ${char}, tap to replay`}
    />
  )
}

export function StrokeOrder({ word }: { word: string }) {
  const isDark = useIsDark()
  const chars = [...word].filter(c => CJK_RE.test(c))
  if (chars.length === 0) return null

  return (
    <section className="stroke-order-section">
      <p className="stroke-order-label">Stroke Order</p>
      <div className="stroke-order-chars">
        {chars.map((char, i) => (
          <CharWriter key={`${char}-${i}`} char={char} isDark={isDark} />
        ))}
      </div>
      <p className="stroke-replay-hint">Tap to replay</p>
    </section>
  )
}
