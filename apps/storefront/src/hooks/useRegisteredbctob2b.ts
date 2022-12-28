import {
  useEffect,
  SetStateAction,
  Dispatch,
} from 'react'

import {
  useB3Lang,
} from '@b3/lang'

import type {
  OpenPageState,
} from '@b3/hooks'

import globalB3 from '@b3/global-b3'

const useRegisteredbctob2b = (setOpenPage: Dispatch<SetStateAction<OpenPageState>>, isB2BUser: boolean, customerId:number | string) => {
  const b3Lang = useB3Lang()

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

  useEffect(() => {
    if (!isB2BUser && customerId) {
      // already exist
      if (document.querySelector('.navUser-item.navUser-convert-b2b')) {
        return
      }

      const convertB2BNavNode = createConvertB2BNavNode()
      const accountNode = document.querySelector(globalB3['dom.navUserLoginElement'])
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
  }, [isB2BUser, customerId])
}

export {
  useRegisteredbctob2b,
}
