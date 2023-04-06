import {
  SnackbarOrigin, SxProps,
} from '@mui/material'

import {
  trim,
} from 'lodash'

const getLocation = (location: string): SnackbarOrigin => ({
  vertical: location.includes('top') ? 'top' : 'bottom',
  horizontal: location.includes('Left') ? 'left' : 'right',
})

const getStyles = (customCss: string): SxProps => {
  const str = trim(customCss)
  const sx = str.replace(/\n/g, '').split(';').reduce((acc: Record<string, string>, style) => {
    const [property, value] = style.split(':')
    if (property && value) {
      acc[property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value.trim().replace(';', '')
    }
    return acc
  }, {})

  return sx
}

export {
  getLocation,
  getStyles,
}
