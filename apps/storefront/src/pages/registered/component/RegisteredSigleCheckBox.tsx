import { memo } from 'react'
import { useB3Lang } from '@b3/lang'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
} from '@mui/material'

const RegisteredSigleCheckBox = memo((props: any) => {
  const b3Lang = useB3Lang()
  const { isChecked, onChange } = props
  return (
    <FormControl component="fieldset">
      <FormGroup aria-label="position" row>
        <FormControlLabel
          checked={isChecked}
          onChange={onChange}
          control={<Checkbox />}
          label={b3Lang('register.registeredSingleCheckBox.label')}
          labelPlacement="end"
        />
      </FormGroup>
    </FormControl>
  )
})

export default RegisteredSigleCheckBox
