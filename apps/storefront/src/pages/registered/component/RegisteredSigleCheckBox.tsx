import {
  memo,
} from 'react'
import {
  FormControlLabel,
  FormControl,
  Checkbox,
  FormGroup,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

const RegisteredSigleCheckBox = memo((props: any) => {
  const b3Lang = useB3Lang()
  const {
    isChecked,
    onChange,
  } = props
  return (
    <FormControl component="fieldset">
      <FormGroup
        aria-label="position"
        row
      >
        <FormControlLabel
          checked={isChecked}
          onChange={onChange}
          control={<Checkbox />}
          label={b3Lang('intl.user.register.RegisteredSingleCheckBox.label')}
          labelPlacement="end"
        />
      </FormGroup>
    </FormControl>
  )
})

export default RegisteredSigleCheckBox
