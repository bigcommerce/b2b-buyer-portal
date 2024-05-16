import { MouseEvent, useState } from 'react';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

function B3FilterToggleTable() {
  const [tableValue, setTableValue] = useState('bold');

  const handleFormat = (_: MouseEvent<HTMLElement>, value: string) => {
    setTableValue(value);
  };
  return (
    <ToggleButtonGroup value={tableValue} exclusive onChange={handleFormat}>
      <ToggleButton value="bold">
        <DensitySmallIcon />
      </ToggleButton>
      <ToggleButton value="italic">
        <QrCodeIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default B3FilterToggleTable;
