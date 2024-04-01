import { Avatar, Box } from '@mui/material'

import B3ControlRectangle from './B3ControlRectangle'
import { ColorContainer } from './styled'
import Form from './ui'

export default function B3ControlSwatchRadio(props: Form.B3UIProps) {
  const { options } = props

  const newOptions = options.map((option: Form.SwatchRadioGroupListProps) => ({
    ...option,
    label:
      option?.image && option?.image.data ? (
        <Avatar
          variant="square"
          sx={{
            width: '22px',
            height: '22px',

            '& img': {
              width: '22px',
              height: '22px',
            },
          }}
        >
          <img src={option?.image.data} alt={option?.image.alt} />
        </Avatar>
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
  }))

  const labelStyle = {
    padding: '1px',
    height: '26px',
    minWidth: 'initial',
  }

  return (
    <B3ControlRectangle
      {...props}
      options={newOptions}
      fieldType="rectangle"
      labelStyle={labelStyle}
    />
  )
}
