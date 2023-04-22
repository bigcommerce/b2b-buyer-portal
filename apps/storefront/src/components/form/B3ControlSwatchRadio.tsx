import { Box } from '@mui/material'

import B3ControlRectangle from './B3ControlRectangle'
import { ColorContainer } from './styled'
import Form from './ui'

export default function B3ControlSwatchRadio(props: Form.B3UIProps) {
  const { options } = props

  const newOptions = options.map((option: Form.SwatchRadioGroupListProps) => ({
    ...option,
    label: (
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
