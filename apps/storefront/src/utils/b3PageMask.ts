const showPageMask = (showMask: boolean) => {
  if (showMask) {
    const maskDiv = document.createElement('div')
    maskDiv.setAttribute('id', 'body-mask')
    maskDiv.innerText = 'Loading...'

    document.body.appendChild(maskDiv)
  } else if (document.getElementById('body-mask')) {
    document.getElementById('body-mask')?.remove()
  }
}

export {
  showPageMask,
}
