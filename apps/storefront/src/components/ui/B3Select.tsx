import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import { getContrastColor } from '../outSideComponents/utils/b3CustomStyles';

interface ConfigProps {
  labelName: string;
  valueName: string;
}

interface B3SelectProps<T> {
  value: T;
  handleChange: (value: string) => void;
  label: string;
  config?: ConfigProps | undefined;
  list: Array<any>;
  isFirstSelect?: boolean;
  firstSelectText?: string;
  w?: number;
  size?: 'small' | 'medium' | undefined;
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
    handleChange(event.target.value);
  };

  const labelName: string = config?.labelName || 'name';
  const valueName: string = config?.valueName || 'id';

  if (list.length === 0) return null;

  return (
    <FormControl
      sx={{
        borderRadius: '4px',
        borderBottomLeftRadius: '0',
        borderBottomRightRadius: '0',
        width: w || 120,
        backgroundColor: '#efeae7',
        '& .MuiInputBase-root.MuiFilledInput-root': {
          backgroundColor: '#efeae7',
        },
      }}
      variant="filled"
    >
      <InputLabel
        id="demo-simple-select-filled-label"
        sx={{
          color: getContrastColor('#efeae7'),
        }}
      >
        {label}
      </InputLabel>
      <Select
        id="demo-simple-select-filled"
        labelId="demo-simple-select-filled-label"
        onChange={handleSelectChange}
        size={size}
        sx={{
          color: getContrastColor('#efeae7'),
          '& svg': {
            color: getContrastColor('#efeae7'),
          },
        }}
        value={value}
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
  );
}
