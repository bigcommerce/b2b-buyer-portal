import { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react'
import type { OpenPageState } from '@b3/hooks'

import { HeadlessRoutes } from '@/constants'
import {
  addProductFromProductPageToQuote,
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
} from '@/hooks/dom/utils'
import { GlobaledContext } from '@/shared/global'

interface HeadlessControllerProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function HeadlessController({
  setOpenPage,
}: HeadlessControllerProps) {
  const {
    state: { role },
  } = useContext(GlobaledContext)
  const { addToQuote: addProductFromPage } =
    addProductFromProductPageToQuote(setOpenPage)
  const { addToQuote: addProductsFromCart } =
    addProductsFromCartToQuote(setOpenPage)

  // Keep updated role value
  const addProductFromPageRef = useRef(() => addProductFromPage(role))
  addProductFromPageRef.current = () => addProductFromPage(role)

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
        quote: {
          addProductFromPage: addProductFromPageRef.current,
          addProductsFromCart: () => addProductsFromCart(),
          addProducts: (items) => addProductsToDraftQuote(items),
        },
      },
    }
  }, [])

  return null
}
