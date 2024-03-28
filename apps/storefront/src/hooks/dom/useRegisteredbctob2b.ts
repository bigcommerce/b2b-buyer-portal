import { Dispatch, SetStateAction, useContext, useEffect } from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'

import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'

import useDomVariation from './useDomVariation'

const useRegisteredbctob2b = (
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
) => {
  const b3Lang = useB3Lang()

  const {
    state: { isB2BUser, customerId, companyInfo, registerEnabled },
  } = useContext(GlobaledContext)

  const {
    state: {
      accountLoginRegistration: { b2b },
    },
  } = useContext(CustomStyleContext)

  const [openQuickView] = useDomVariation(globalB3['dom.navUserLoginElement'])

  useEffect(() => {
    const createConvertB2BNavNode = () => {
      const convertB2BNavNode = document.createElement('li')
      convertB2BNavNode.className = 'navUser-item navUser-convert-b2b'
      convertB2BNavNode.innerHTML = `
        <a class="navUser-action" href="javascript:;" aria-label="Gift Certificates">
          ${b3Lang('global.registerB2B.linkText')}
        </a>
      `
      return convertB2BNavNode
    }

    if (
      b2b &&
      !isB2BUser &&
      +companyInfo.companyStatus === 99 &&
      customerId &&
      document.querySelector(globalB3['dom.navUserLoginElement'])
    ) {
      // already exist
      const b2ToB2b = document.querySelector(
        '.navUser-item.navUser-convert-b2b'
      )

      if (b2ToB2b) {
        if (!registerEnabled) b2ToB2b.remove()

        return
      }

      if (!registerEnabled) return

      const convertB2BNavNode = createConvertB2BNavNode()
      const accountNode = document.querySelector(
        globalB3['dom.navUserLoginElement']
      )

      accountNode?.parentNode?.insertBefore(convertB2BNavNode, accountNode)

      const linkNode = convertB2BNavNode.querySelector('a')
      if (linkNode) {
        linkNode.onclick = () => {
          setOpenPage({
            isOpen: true,
            openUrl: '/registeredbctob2b',
          })
        }
      }
    } else {
      document.querySelector('.navUser-item.navUser-convert-b2b')?.remove()
    }
    // ignoring to not add b3Lang to the dependencies array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isB2BUser,
    customerId,
    openQuickView,
    b2b,
    registerEnabled,
    companyInfo.companyStatus,
  ])
}

export default useRegisteredbctob2b
