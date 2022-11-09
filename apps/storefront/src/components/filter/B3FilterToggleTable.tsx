import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import DensitySmallIcon from '@mui/icons-material/DensitySmall'
import QrCodeIcon from '@mui/icons-material/QrCode'
import {
  useState, MouseEvent,
} from 'react'

const B3FilterToggleTable = () => {
  const [tableValue, setTableValue] = useState('bold')

  const handleFormat = (
    event: MouseEvent<HTMLElement>,
    value: string,
  ) => {
    setTableValue(value)
  }
  return (
    <ToggleButtonGroup
      value={tableValue}
      exclusive
      onChange={handleFormat}
    >
      <ToggleButton
        value="bold"
      >
        <DensitySmallIcon />
      </ToggleButton>
      <ToggleButton
        value="italic"
      >
        <QrCodeIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default B3FilterToggleTable
