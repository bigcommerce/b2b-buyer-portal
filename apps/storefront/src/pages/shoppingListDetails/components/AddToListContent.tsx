import {
  Box,
  Divider,
  Typography,
  Button,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  SearchProduct,
} from './SearchProduct'

import {
  QuickAdd,
} from './QuickAdd'

interface AddToListContentProps {
  updateList: () => void
}

export const AddToListContent = (props: AddToListContentProps) => {
  const {
    updateList,
  } = props

  return (
    <Box>
      <Typography variant="h5">Add to list</Typography>
      <SearchProduct
        updateList={updateList}
      />

      <Divider />

      <QuickAdd
        updateList={updateList}
      />

      <Divider />

      <Box sx={{
        margin: '20px 0 0',
      }}
      >
        <Button variant="text">
          <UploadFileIcon sx={{
            marginRight: '8px',
          }}
          />
          Bulk upload CSV
        </Button>
      </Box>
    </Box>
  )
}
