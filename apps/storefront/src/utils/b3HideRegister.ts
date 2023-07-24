import globalB3 from '@b3/global-b3'

const handleHideRegisterPage = (registerEnabled: boolean) => {
  const registerPageAll = document.querySelectorAll(globalB3['dom.register'])
  // Text between sign in and register - [or]
  const navUserOrText = document.querySelectorAll('.navUser-or')

  if (registerPageAll.length > 0) {
    registerPageAll.forEach((page: CustomFieldItems) => {
      page.style.display = registerEnabled ? 'inline-block' : 'none'
    })
  }

  if (navUserOrText.length > 0) {
    navUserOrText.forEach((text: CustomFieldItems) => {
      text.style.display = registerEnabled ? 'inline-block' : 'none'
    })
  }
}

export default handleHideRegisterPage
