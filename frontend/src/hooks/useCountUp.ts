import { useState, useEffect, useRef } from 'react'

const useCountUp = (target: number, disabled: boolean, duration = 800) => {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (disabled || target === 0) {
      setValue(0)
      return
    }

    startRef.current = null
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, disabled, duration])

  return value
}

export default useCountUp
