interface OpenPageByClickProps {
  href: string
  role: number | string
  isRegisterAndLogin: boolean
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

// Vault theme remove associated nav
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

const redirectBcMenus = (key: string, role: number): string => {
  // Supermarket theme
  if (key === '/account.php') {
    return +role !== 3 ? '/orders' : '/dashboard'
  }

  // Vault theme
  // superAdmin exits's url
  const superAdminExistUrl = ['/accountSettings']
  const currentItem: CustomFieldItems =
    accountTarget.find((item) => key.includes(item.originUrl)) || {}

  if (currentItem && superAdminExistUrl.includes(currentItem.newTargetUrl)) {
    return +role !== 3 ? currentItem.newTargetUrl : '/dashboard'
  }

  if (currentItem) {
    return currentItem.newTargetUrl
  }

  return '/orders'
}

const getCurrentLoginUrl = (href: string): string => {
  // quit login
  if (href.includes('logout')) {
    return '/login?loginFlag=3'
  }

  if (href?.includes('create_account')) {
    return '/register'
  }

  return '/login'
}

const openPageByClick = ({
  href,
  role,
  isRegisterAndLogin,
}: OpenPageByClickProps) => {
  if (role === 100) return '/login'

  // register and login click
  if (href.includes('/login') || isRegisterAndLogin) {
    return getCurrentLoginUrl(href)
  }

  // other click
  return redirectBcMenus(href, +role)
}

export { getCurrentLoginUrl, openPageByClick, redirectBcMenus, removeBCMenus }
