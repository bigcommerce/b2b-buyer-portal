import {
  SnackbarOrigin,
  SxProps,
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

const getContrastColor = (color: string) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  return brightness >= 128 ? '#000' : '#fff'
}

const b3HexToRgb = (color: string, transparency?: number) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return transparency ? `rgb(${r}, ${g}, ${b}, ${transparency})` : `rgb(${r}, ${g}, ${b})`
}

export {
  getLocation,
  getStyles,
  getContrastColor,
  b3HexToRgb,
}
