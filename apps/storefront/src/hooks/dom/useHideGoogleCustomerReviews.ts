import { useEffect } from 'react'

import useMobile from '@/hooks/useMobile'

interface B3HideGoogleCustomerReviewsProps {
  isOpen: boolean
}

const useHideGoogleCustomerReviews = (
  props: B3HideGoogleCustomerReviewsProps
) => {
  const { isOpen } = props

  const [isMobile] = useMobile()

  useEffect(() => {
    if (isMobile) return
    const googleCustomerReviewsDoms = document.querySelectorAll(
      '[title="Google Customer Reviews"]'
    )
    const newVisibilityStyle = isOpen ? 'none' : 'inline-block'

    googleCustomerReviewsDoms.forEach((dom) => {
      const d = dom
      if (d?.parentElement) d.parentElement.style.display = newVisibilityStyle
    })
  }, [isOpen])
}

export default useHideGoogleCustomerReviews
