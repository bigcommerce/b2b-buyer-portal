import {
  Box,
  Divider,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material'

import UploadFileIcon from '@mui/icons-material/UploadFile'

import {
  SearchProduct,
} from './SearchProduct'

import {
  QuickAdd,
} from './QuickAdd'

interface AddToListProps {
  updateList: () => void
}

export const AddToShoppingList = (props: AddToListProps) => {
  const {
    updateList,
  } = props

  return (
    <Card sx={{
      marginBottom: '50px',
    }}
    >
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
