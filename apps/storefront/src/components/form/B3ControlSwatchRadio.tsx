import { Box } from '@mui/material';

import B3ControlRectangle, { RectangleProps } from './B3ControlRectangle';
import { ColorContainer } from './styled';

export interface SwatchRadioProps extends Omit<RectangleProps, 'fieldType' | 'options'> {
  options: { value: string | number; image?: { data: string }; colors?: string[] }[];
}

export default function B3ControlSwatchRadio(props: SwatchRadioProps) {
  const { options } = props;

  const newOptions = options.map((option) => ({
    ...option,
    label:
      option?.image && option?.image.data ? (
        <Box
          sx={{
            width: '22px',
            height: '22px',

            '& .swatch-image-item': {
              width: '22px',
              height: '22px',
              background: `url(${option?.image.data})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
            },
          }}
        >
          <div className="swatch-image-item" />
        </Box>
      ) : (
        <ColorContainer>
          {(option.colors || []).map((color: string) => (
            <Box
              className="swatch-color-item"
              sx={{
                background: `${color}`,
              }}
              key={color}
            />
          ))}
        </ColorContainer>
      ),
  }));

  const labelStyle = {
    padding: '1px',
    height: '26px',
    minWidth: 'initial',
  };

  return <B3ControlRectangle {...props} options={newOptions} labelStyle={labelStyle} />;
}
