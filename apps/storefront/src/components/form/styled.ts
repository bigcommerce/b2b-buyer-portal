import { styled } from '@mui/material/styles'

export const DropzoneBox = styled('div')(() => ({
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
