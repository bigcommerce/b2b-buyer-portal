import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material'

interface ConfigProps {
  labelName: string
  valueName: string
}

interface B3SelectProps<T> {
  value: T
  handleChange: (value: string) => void
  label: string
  config?: ConfigProps | undefined
  list: Array<any>
  isFirstSelect?: boolean
  firstSelectText?: string
  w?: number
  size?: 'small' | 'medium' | undefined
}

export default function B3Select<T extends string | undefined>({
  value,
  handleChange,
  label,
  list,
  config = {
    labelName: '',
    valueName: '',
  },
  isFirstSelect = true,
  firstSelectText,
  size = 'small',
  w,
}: B3SelectProps<T>) {
  const handleSelectChange = (event: SelectChangeEvent) => {
    handleChange(event.target.value)
  }

  const labelName: string = config?.labelName || 'name'
  const valueName: string = config?.valueName || 'id'

  if (list.length === 0) return null

  return (
    <FormControl
      variant="filled"
      sx={{
        width: w || 120,
      }}
    >
      <InputLabel id="demo-simple-select-filled-label">{label}</InputLabel>
      <Select
        labelId="demo-simple-select-filled-label"
        id="demo-simple-select-filled"
        value={value}
        size={size}
        onChange={handleSelectChange}
      >
        {isFirstSelect && (
          <MenuItem value="">
            <em>{firstSelectText || 'None'}</em>
          </MenuItem>
        )}

        {list.map((item) => (
          <MenuItem key={item[valueName]} value={item[valueName]}>
            {item[labelName]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
