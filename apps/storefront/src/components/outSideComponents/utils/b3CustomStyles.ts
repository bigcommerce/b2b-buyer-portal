import { SnackbarOrigin, SxProps } from '@mui/material'
import { grey } from '@mui/material/colors'
import { trim } from 'lodash'

interface RGBColor {
  r: number
  g: number
  b: number
}

export const getLocation = (location: string): SnackbarOrigin => ({
  vertical: location.includes('top') ? 'top' : 'bottom',
  horizontal: location.includes('Left') ? 'left' : 'right',
})

export const getStyles = (customCss: string): SxProps => {
  const str = trim(customCss)
  const sx = str
    .replace(/\n/g, '')
    .split(';')
    .reduce((acc: Record<string, string>, style) => {
      const [property, value] = style.split(':')
      if (property && value) {
        acc[
          property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        ] = value.trim().replace(';', '')
      }
      return acc
    }, {})

  return sx
}

const decomposeColor = (color: string): RGBColor => {
  let hex = color.slice(1)

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  const rgb = {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }

  return rgb
}

const getLuminance = (color: string): number => {
  const rgb = decomposeColor(color)
  const lumR =
    rgb.r / 255 <= 0.03928
      ? rgb.r / 255 / 12.92
      : ((rgb.r / 255 + 0.055) / 1.055) ** 2.4
  const lumG =
    rgb.g / 255 <= 0.03928
      ? rgb.g / 255 / 12.92
      : ((rgb.g / 255 + 0.055) / 1.055) ** 2.4
  const lumB =
    rgb.b / 255 <= 0.03928
      ? rgb.b / 255 / 12.92
      : ((rgb.b / 255 + 0.055) / 1.055) ** 2.4
  return 0.2126 * lumR + 0.7152 * lumG + 0.0722 * lumB
}

const getContrastRatio = (foreground: string, background: string): number => {
  const lumA = getLuminance(foreground)
  const lumB = getLuminance(background)
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05)
}

export const getContrastColor = (color: string) => {
  let brightness: string | undefined
  const res = Object.keys(grey).find(
    (key) => getContrastRatio(grey[key as keyof typeof grey], color) > 4.5
  )
  if (res) {
    brightness = grey[res as keyof typeof grey]
  } else {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    brightness = (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#000' : '#fff'
  }

  return brightness || '#fff'
}

export const b3HexToRgb = (color: string, transparency?: number) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  return transparency
    ? `rgb(${r}, ${g}, ${b}, ${transparency})`
    : `rgb(${r}, ${g}, ${b})`
}

export const getHoverColor = (color: string, factor: number): string => {
  const hexToRGB = (hex: string): number[] =>
    hex.match(/\w\w/g)?.map((x) => parseInt(x, 16)) || []

  const [r, g, b] = hexToRGB(color)

  const newR = Math.round(r * (1 - factor))
  const newG = Math.round(g * (1 - factor))
  const newB = Math.round(b * (1 - factor))

  const componentToHex = (c: number): string => {
    const hex = c.toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${componentToHex(newR)}${componentToHex(newG)}${componentToHex(
    newB
  )}`
}
