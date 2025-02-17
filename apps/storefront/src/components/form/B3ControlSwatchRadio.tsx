import { Box } from '@mui/material';

import B3ControlRectangle from './B3ControlRectangle';
import { ColorContainer } from './styled';
import Form from './ui';

export default function B3ControlSwatchRadio(props: Form.B3UIProps) {
  const { options } = props;

  const newOptions = options.map((option: Form.SwatchRadioGroupListProps) => ({
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

  // @ts-expect-error to be removed once SwatchRadio props are rationalized
  return <B3ControlRectangle {...props} options={newOptions} labelStyle={labelStyle} />;
}
