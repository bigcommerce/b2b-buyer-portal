import { memo } from 'react'
import {
  FormControlLabel,
  FormControl,
  Checkbox,
  FormGroup,
} from '@mui/material'

const RegisteredSigleCheckBox = memo((props: any) => {
  const { isChecked, onChange } = props
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          checked={isChecked}
          onChange={onChange}
          control={<Checkbox />}
          label="Email marketing newsletter"
          labelPlacement="end"
        />
      </FormGroup>
    </FormControl>
  )
})

export default RegisteredSigleCheckBox
