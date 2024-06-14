import styled from '@emotion/styled';

interface FlexProps {
  isHeader?: boolean;
  isMobile?: boolean;
}

interface FlexItemProps {
  width?: string;
  padding?: string;
  flexBasis?: string;
  minHeight?: string;
  textAlignLocation?: string;
}

const Flex = styled('div')<FlexProps>(({ isHeader, isMobile }) => {
  const headerStyle = isHeader
    ? {
        borderBottom: '1px solid #D9DCE9',
        paddingBottom: '8px',
        alignItems: 'center',
      }
    : {
        alignItems: 'flex-start',
      };

  const mobileStyle = isMobile
    ? {
        borderTop: '1px solid #D9DCE9',
        padding: '12px 0 12px',
        '&:first-of-type': {
          marginTop: '12px',
        },
      }
    : {};

  const flexWrap = isMobile ? 'wrap' : 'initial';

  return {
    display: 'flex',
    wordBreak: 'break-word',
    padding: '8px 0 0',
    gap: '8px',
    flexWrap,
    ...headerStyle,
    ...mobileStyle,
  };
});

const FlexItem = styled('div')(
  ({ width, padding = '0', flexBasis, textAlignLocation }: FlexItemProps) => ({
    display: 'flex',
    flexGrow: width ? 0 : 1,
    flexShrink: width ? 0 : 1,
    alignItems: 'flex-start',
    justifyContent: textAlignLocation === 'right' ? 'flex-end' : 'flex-start',
    flexBasis,
    width,
    padding,
  }),
);

const ProductHead = styled('div')(() => ({
  fontSize: '0.875rem',
  lineHeight: '1.5',
  color: '#263238',
}));

const ProductImage = styled('img')(() => ({
  width: '60px',
  borderRadius: '4px',
  flexShrink: 0,
}));

const ProductOptionText = styled('div')(() => ({
  fontSize: '0.75rem',
  lineHeight: '1.5',
  color: '#455A64',
}));

const defaultItemStyle = {
  default: {
    width: '15%',
  },
  qty: {
    width: '80px',
  },
};

const mobileItemStyle = {
  default: {
    width: '100%',
    padding: '0 0 0 128px',
  },
  qty: {
    width: '100%',
    padding: '0 0 0 128px',
  },
};

export {
  defaultItemStyle,
  Flex,
  FlexItem,
  mobileItemStyle,
  ProductHead,
  ProductImage,
  ProductOptionText,
};
