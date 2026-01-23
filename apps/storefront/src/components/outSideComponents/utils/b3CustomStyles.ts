import { SnackbarOrigin } from '@mui/material';
import trim from 'lodash-es/trim';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export const getLocation = (location: string): SnackbarOrigin => ({
  vertical: location.includes('top') ? 'top' : 'bottom',
  horizontal: location.includes('Left') ? 'left' : 'right',
});

export const getPosition = (
  horizontalPadding: string,
  verticalPadding: string,
  location = 'bottomRight',
) => {
  const locations = getLocation(location);
  const positions = {
    top: 'auto',
    bottom: '24px',
    left: 'auto',
    right: '24px',
  };

  switch (locations.horizontal) {
    case 'left':
      positions.left = horizontalPadding ? `${horizontalPadding}px !important` : '24px';
      positions.right = 'auto';
      break;

    default:
      positions.left = 'auto';
      positions.right = horizontalPadding ? `${horizontalPadding}px !important` : '24px';
      break;
  }

  switch (locations.vertical) {
    case 'top':
      positions.top = verticalPadding ? `${verticalPadding}px !important` : '24px';
      positions.bottom = 'auto';
      break;

    default:
      positions.top = 'auto';
      positions.bottom = verticalPadding ? `${verticalPadding}px !important` : '24px';
      break;
  }

  return positions;
};

export const splitCustomCssValue = (customCss: string) => {
  let cssValue = customCss;

  // Parse the media block
  const mediaRegex = /(@media[^{]+{[^}]+})/g;
  // media block
  const mediaBlocks: string[] = [];

  // Blocks that do not contain media
  cssValue = cssValue.replace(mediaRegex, (_, mediaBlock) => {
    mediaBlocks.push(mediaBlock);

    return '';
  });

  return {
    mediaBlocks,
    cssValue: cssValue.trim(),
  };
};

export const setMediaStyle = (mediaBlocks: string[], className: string) => {
  if (mediaBlocks.length === 0) {
    return;
  }

  const classNameArr = className.split(' ').map((item) => `.${item}`);
  const classNameId = classNameArr.join('');

  const newCustomCss = mediaBlocks.map((media: string) => {
    const mediaArr = media.split('\n');
    const newMediaArr = mediaArr.map((style) => {
      if (style.includes('@media')) {
        return style;
      }

      const [property, value] = style.split(':');
      let newValue = value;

      if (property.trim() === 'color' || property.trim() === 'background-color') {
        newValue = value.replace(';', '!important;');
      }

      return newValue.trim() ? `${property}: ${newValue}` : property;
    });

    const newMedia = newMediaArr.join('\n');

    return newMedia;
  });

  let value = '';

  newCustomCss.forEach((style) => {
    value += `${style}\n`;
  });

  const css = `${classNameId} {
    ${value}
  }`;

  const style = document.createElement('style');

  style.appendChild(document.createTextNode(css));

  const head = document.head || document.getElementsByTagName('head')[0];

  head.appendChild(style);
};

export const setMUIMediaStyle = (mediaBlocks: string[]) => {
  if (mediaBlocks.length === 0) {
    return {};
  }

  const newMedia: CustomFieldItems = {};

  mediaBlocks.forEach((media: string) => {
    const mediaArr = media.split('\n');
    const first = mediaArr.find((item) => item.includes('@media'));

    if (first) {
      const key = first.split('{')[0];

      mediaArr.forEach((style) => {
        const [property, value] = style.split(':');

        if (!style.includes('@media') && value) {
          newMedia[key] = {
            ...(newMedia[key] || {}),
            [property.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]: value
              .trim()
              .replace(';', ''),
          };
        }
      });
    }
  });

  return newMedia;
};

export const getStyles = (customCss: string) => {
  const str = trim(customCss);
  const sx = str
    .replace(/\n/g, '')
    .split(';')
    .reduce((acc: Record<string, string>, style) => {
      const [property, value] = style.split(':');

      if (property && value) {
        acc[property.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value
          .trim()
          .replace(';', '');
      }

      return acc;
    }, {});

  return sx;
};

const decomposeColor = (color: string): RGBColor => {
  let hex = color.slice(1);

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const rgb = {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };

  return rgb;
};

const getLuminance = (color: string): number => {
  const rgb = decomposeColor(color);
  const lumR =
    rgb.r / 255 <= 0.03928 ? rgb.r / 255 / 12.92 : ((rgb.r / 255 + 0.055) / 1.055) ** 2.4;
  const lumG =
    rgb.g / 255 <= 0.03928 ? rgb.g / 255 / 12.92 : ((rgb.g / 255 + 0.055) / 1.055) ** 2.4;
  const lumB =
    rgb.b / 255 <= 0.03928 ? rgb.b / 255 / 12.92 : ((rgb.b / 255 + 0.055) / 1.055) ** 2.4;

  return 0.2126 * lumR + 0.7152 * lumG + 0.0722 * lumB;
};

const getContrastRatio = (foreground: string, background: string): number => {
  const lumA = getLuminance(foreground);
  const lumB = getLuminance(background);

  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
};

export const getContrastColor = (color: string) => {
  const contrastThreshold = 4.5;
  const blackContrast = getContrastRatio(color, '#000000');
  const whiteContrast = getContrastRatio(color, '#FFFFFF');

  if (blackContrast >= contrastThreshold || whiteContrast < blackContrast) {
    return '#000000';
  }

  return '#FFFFFF';
};

export const b3HexToRgb = (color: string, transparency?: number) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return transparency ? `rgb(${r}, ${g}, ${b}, ${transparency})` : `rgb(${r}, ${g}, ${b})`;
};

export const getHoverColor = (color: string, factor: number): string => {
  const hexToRGB = (hex: string): number[] => hex.match(/\w\w/g)?.map((x) => parseInt(x, 16)) || [];

  const [r, g, b] = hexToRGB(color);

  const newR = Math.round(r * (1 - factor));
  const newG = Math.round(g * (1 - factor));
  const newB = Math.round(b * (1 - factor));

  const componentToHex = (c: number): string => {
    const hex = c.toString(16);

    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${componentToHex(newR)}${componentToHex(newG)}${componentToHex(newB)}`;
};
