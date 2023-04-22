const showPageMask = (showMask: boolean) => {
  const bodyMask = document.getElementById('body-mask')

  if (showMask) {
    if (bodyMask) {
      bodyMask.style.display = 'block'
    } else {
      const maskDiv = document.createElement('div')
      maskDiv.setAttribute('id', 'body-mask')
      maskDiv.innerText = 'Loading...'

      document.body.appendChild(maskDiv)
      maskDiv.style.display = 'none'
    }
  } else if (bodyMask) {
    bodyMask.style.display = 'none'
  }
}

const createFrameLoading = () => {
  if (!document.getElementById('body-mask')) {
    const maskDiv = document.createElement('div')
    maskDiv.setAttribute('id', 'body-mask')
    maskDiv.innerHTML = '<p class="body-mask-loadding">Loading...</p>'

    document.body.appendChild(maskDiv)
    maskDiv.style.display = 'none'
  }
}

export { createFrameLoading, showPageMask }
