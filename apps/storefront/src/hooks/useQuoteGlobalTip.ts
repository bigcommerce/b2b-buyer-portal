import {
  useEffect,
  SetStateAction,
  Dispatch,
} from 'react'

import type {
  OpenPageState,
} from '@b3/hooks'
import {
  QuoteGlobalTip,
} from '@/utils'

type SetOpenPageProps = Dispatch<SetStateAction<OpenPageState>>

interface OpenTipStateProps {
  isOpen: boolean,
  message: string,
  variant: string,
}
type InitTipProps = () => void

export const useQuoteGlobalTip = ({
  isOpen,
  message,
  variant,
}: OpenTipStateProps, setOpenPage: SetOpenPageProps, initTip: InitTipProps) => {
  useEffect(() => {
    if (!isOpen) {
      QuoteGlobalTip.delete()
      return
    }
    const quoteBtnClick = () => {
      setOpenPage({
        isOpen: true,
        openUrl: '/quoteDraft',
      })
      initTip()
    }

    const quoteCloseBtnClick = () => {
      initTip()
    }
    const btnCallBack = () => {
      const linkBtn = document.querySelector('#globalTip .b2b-quote-global-btn-goto')
      linkBtn?.addEventListener('click', quoteBtnClick)
    }

    const btnCloseCallBack = () => {
      const closeBtn = document.querySelector('#globalTip .b2b-quote-global-btn-close')
      closeBtn?.addEventListener('click', quoteCloseBtnClick)
    }
    if (variant === 'success') {
      QuoteGlobalTip.createTip(message, {
        cd: btnCallBack,
        closeCd: btnCloseCallBack,
        linkSize: 'OPEN QUOTE',
      })
    } else {
      QuoteGlobalTip.createTip(message, {
        closeCd: btnCloseCallBack,
        variant: 'error',
      })
    }

    return () => {
      const linkBtn = document.querySelector('#globalTip .b2b-quote-global-btn-goto')
      const closeBtn = document.querySelector('#globalTip .b2b-quote-global-btn-close')
      if (linkBtn) linkBtn.removeEventListener('click', quoteBtnClick)
      if (closeBtn) closeBtn.removeEventListener('click', btnCloseCallBack)
    }
  }, [isOpen, message, variant])
}
