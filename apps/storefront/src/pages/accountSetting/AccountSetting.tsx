import {
  Box,
  Button,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  B3CustomForm,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

// import {
//   snackbar,
// } from '@/utils'

import {
  getAccountSettingFiles,
} from './config'

const AccountSetting = () => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      console.log(data)
    })()
  }

  const xs = isMobile ? 12 : 6

  const accountSettingFiles = getAccountSettingFiles(xs, true)
  return (
    <Box>
      <B3CustomForm
        formFields={accountSettingFiles}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />

      <Button
        onClick={handleAddUserClick}
        variant="contained"
      >
        update details
      </Button>
    </Box>
  )
}

export default AccountSetting
