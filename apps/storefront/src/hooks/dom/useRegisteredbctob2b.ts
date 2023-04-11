import {
  SetStateAction,
  Dispatch,
  useEffect,
  useContext,
} from 'react'

import {
  useB3Lang,
} from '@b3/lang'

import type {
  OpenPageState,
} from '@b3/hooks'

import globalB3 from '@b3/global-b3'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

import {
  useDomVariation,
} from './useDomVariation'

const useRegisteredbctob2b = (setOpenPage: Dispatch<SetStateAction<OpenPageState>>) => {
  const b3Lang = useB3Lang()

  const {
    state: {
      isB2BUser,
      customerId,
      companyInfo,
    },
  } = useContext(GlobaledContext)

  const {
    state: {
      accountLoginRegistration: {
        b2b,
      },
    },
  } = useContext(CustomStyleContext)

  const createConvertB2BNavNode = () => {
    const convertB2BNavNode = document.createElement('li')
    convertB2BNavNode.className = 'navUser-item navUser-convert-b2b'
    convertB2BNavNode.innerHTML = `
      <a class="navUser-action" href="javascript:;" aria-label="Gift Certificates">
        ${b3Lang('intl.global.nav.registerB2B.linkText')}
      </a>
    `
    return convertB2BNavNode
  }

  const [openQuickView] = useDomVariation(globalB3['dom.navUserLoginElement'])

  useEffect(() => {
    if (b2b && !isB2BUser && +companyInfo.companyStatus === 99 && customerId && document.querySelector(globalB3['dom.navUserLoginElement'])) {
      // already exist
      console.log(document.querySelector('.navUser-item.navUser-convert-b2b'))
      if (document.querySelector('.navUser-item.navUser-convert-b2b')) {
        return
      }

      const convertB2BNavNode = createConvertB2BNavNode()
      const accountNode = document.querySelector(globalB3['dom.navUserLoginElement'])
      console.log(accountNode, 'accountNode')
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
  }, [isB2BUser, customerId, openQuickView, b2b])
}

export {
  useRegisteredbctob2b,
}
