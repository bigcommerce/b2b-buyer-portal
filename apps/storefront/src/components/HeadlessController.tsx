import { Dispatch, SetStateAction, useEffect } from 'react'
import type { OpenPageState } from '@b3/hooks'

import { HeadlessRoutes } from '@/constants'

interface HeadlessControllerProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function HeadlessController({
  setOpenPage,
}: HeadlessControllerProps) {
  useEffect(() => {
    window.b2b = {
      utils: {
        openPage: (page) => {
          setOpenPage({ isOpen: false })
          setTimeout(
            () => setOpenPage({ isOpen: true, openUrl: HeadlessRoutes[page] }),
            0
          )
        },
      },
    }
  }, [])
  return null
}
