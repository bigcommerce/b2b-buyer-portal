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
      const parentElement = dom?.parentElement
      if (parentElement) parentElement.style.display = newVisibilityStyle
    })
  }, [isOpen, isMobile])
}

export default useHideGoogleCustomerReviews
