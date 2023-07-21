interface GotoPageByClickProps {
  href: string
  role: number | string
  isRegisterArrInclude: boolean
}

const hideAccountItems = [
  '/account.php?action=view_returns',
  '/account.php?action=inbox',
  '/account.php?action=recent_items',
]
const accountTarget = [
  {
    originUrl: '/account.php?action=order_status',
    newTargetUrl: '/orders',
  },
  {
    originUrl: '/account.php?action=address_book',
    newTargetUrl: '/addresses',
  },
  {
    originUrl: '/account.php?action=account_details',
    newTargetUrl: '/accountSettings',
  },
]

const removeBCMenus = () => {
  hideAccountItems.forEach((item: string) => {
    const itemNodes = document.querySelectorAll(`[href^="${item}"]`)

    if (itemNodes.length > 0) {
      itemNodes.forEach((node: CustomFieldItems) => {
        node.parentNode.remove()
      })
    }
  })
}

const redirectBcMenus = (key: string) => {
  let redirectUrl = '/orders'

  const currentItem: CustomFieldItems =
    accountTarget.find((item) => key.includes(item.originUrl)) || {}

  if (currentItem) {
    redirectUrl = currentItem?.newTargetUrl || '/orders'
  }

  return redirectUrl
}

const getCurrentLoginUrl = (href: string): string => {
  let url = '/login'
  if (typeof href !== 'string') return url
  if (href.includes('logout')) {
    url = '/login?loginFlag=3'
  }
  if (href?.includes('create_account')) {
    url = '/register'
  }

  return url
}

const gotoPageByClick = ({
  href,
  role,
  isRegisterArrInclude,
}: GotoPageByClickProps) => {
  const getUrl = redirectBcMenus(href)
  let newUrl = role === 3 ? '/dashboard' : getUrl

  if (getUrl === '/accountSettings') {
    newUrl = getUrl
  }

  const gotoUrl = isRegisterArrInclude ? getCurrentLoginUrl(href) : newUrl

  return gotoUrl
}

export { getCurrentLoginUrl, gotoPageByClick, redirectBcMenus, removeBCMenus }
