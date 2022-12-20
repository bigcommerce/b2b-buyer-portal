import {
  styled,
} from '@mui/material/styles'

import {
  FormControl,
  TextField,
  FormControlLabel,
} from '@mui/material'

export const DropzoneBox = styled('div')(() => ({
  cursor: 'pointer',
  '& .MuiDropzoneArea-textContainer': {
    border: '2px dotted #3C64F4',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& .MuiTypography-root': {
      fontSize: '1rem',
      color: '#767676',
      order: 1,
    },
    '& .MuiSvgIcon-root': {
      color: '#D1D1D1',
      fontSize: '3rem',
      marginRight: '0.5rem',
    },
  },
  '& .MuiGrid-container': {
    margin: 0,
    width: '100%',
    '& .MuiGrid-item': {
      maxWidth: '120px',
      flexBasis: '120px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: '4px',
      margin: '20px 20px 0 0',
      boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
      position: 'relative',
      '& .MuiSvgIcon-root': {
        color: '#757575',
        fontSize: '40px',
      },
      '& .MuiTypography-root': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        fontSize: '1rem',
        marginTop: '10px',
        textAlign: 'center',
      },
      '& .MuiButtonBase-root': {
        position: 'absolute',
        top: '-12px',
        right: '-12px',
        width: '24px',
        height: '24px',
        minHeight: 'inherit',
        backgroundColor: '#757575',
        boxShadow: 'none',
        '& .MuiSvgIcon-root': {
          color: '#fff',
          fontSize: '16px',
        },
      },
    },
  },
  '& #client-snackbar': {
    '& .MuiSvgIcon-root': {
      verticalAlign: 'middle',
      marginRight: '4px',
    },
  },
}))

export const PickerFormControl = styled(FormControl)(() => ({
  width: '100%',
}))

export const StyleNumberTextField = styled(TextField)(() => ({
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
  },
}))

export const StyleRectangleFormControlLabel = styled(FormControlLabel)(() => ({
  marginLeft: '0',
  border: '1px solid #767676',
  padding: '5px 10px',
  minWidth: '60px',
  marginRight: '12px',
  marginTop: '12px',
  justifyContent: 'center',
  '& > .MuiRadio-root': {
    width: '0px',
    overflow: 'hidden',
    padding: '0',
  },
}))

export const ProductImageContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '& > img': {
    width: '40px',
    height: '40px',
    margin: '5px 0 6px',
    borderRadius: '4px',
  },
}))

export const ColorContainer = styled('div')(() => ({
  display: 'flex',
  '& .swatch-color-item': {
    width: '22px',
    height: '22px',
  },
}))
