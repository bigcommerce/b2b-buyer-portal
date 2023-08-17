const getTextLenPX = (text: string, fontSize = 14) => {
  if (text) {
    // eslint-disable-next-line no-control-regex
    const strLen = text.replace(/[^\x00-\xff]/gi, 'aa').length

    return (strLen * fontSize) / 2
  }

  return null
}

const getLineNumber = (text: string, fontSize = 14) => {
  const screenWidth = document.body.clientWidth
  const isMobile = screenWidth <= 750

  // pc padding: 12.8 + 12.8 + 8 + 8 + 12 + 12, origin width: 537px
  // mobile padding: (12.8 + 16 + 8 + 12) * 2, origin width: screenWidth, body margin: 16
  const pcLen = 470
  const mobileLen = screenWidth + 16 - 98

  const screenLen = isMobile ? mobileLen : pcLen
  const len = getTextLenPX(text, fontSize)
  if (len !== null) {
    const lineNumber = Math.ceil(len / screenLen)

    return lineNumber
  }

  return 1
}

export { getLineNumber, getTextLenPX }
