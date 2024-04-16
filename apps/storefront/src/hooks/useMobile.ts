import { useEffect, useState } from 'react'

const useMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const resize = () => {
      setIsMobile(document.body.clientWidth <= 750)
    }

    resize()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return [isMobile]
}

export default useMobile
