import { getUsersExtraFieldsInfo } from '@/shared/service/b2b'

interface B2bExtraFieldsProps {
  defaultValue: string
  fieldName: string
  fieldType: 0 | 1 | 2 | 3
  isRequired: boolean
  labelName: string
  listOfValue: null | Array<string>
  maximumLength: string | number | null
  maximumValue: string | number | null
  numberOfRows: string | number | null
  visibleToEnduser: boolean
}

interface FieldsOptionProps {
  label: string
  value: string | number
}

interface FormattedItemsProps {
  [key: string]: string | boolean | number | Array<any> | boolean | undefined
  name: string
}

const FIELD_TYPE = {
  0: 'text',
  1: 'multiline',
  2: 'number',
  3: 'dropdown',
}

const handleConversionExtraItemFormat = (
  userExtraFields: B2bExtraFieldsProps[]
) => {
  const formattedUserExtraFields: FormattedItemsProps[] = userExtraFields.map(
    (item: B2bExtraFieldsProps) => {
      const { listOfValue } = item
      const type = FIELD_TYPE[item.fieldType]

      const currentItems: FormattedItemsProps = {
        isExtraFields: true,
        name: item.fieldName,
        label: item.labelName,
        required: item.isRequired,
        default: item.defaultValue || '',
        fieldType: type,
        xs: 12,
        variant: 'filled',
        size: 'small',
      }

      switch (type) {
        case 'dropdown':
          if (listOfValue) {
            const options: FieldsOptionProps[] = listOfValue?.map(
              (option: string) => ({
                label: option,
                value: option,
              })
            )

            if (options.length > 0) {
              currentItems.options = options
            }
          }

          break
        case 'number':
          currentItems.max = item.maximumValue || ''
          break
        case 'mutiline':
          currentItems.rows = item.numberOfRows || ''
          break
        default:
          currentItems.maxLength = item.maximumLength || ''
          break
      }

      return currentItems
    }
  )

  return formattedUserExtraFields
}

const getB2BUserExtraFields = async () => {
  let userExtraFieldsList: FormattedItemsProps[] = []
  try {
    const { userExtraFields } = await getUsersExtraFieldsInfo()
    const visibleFields = userExtraFields.filter(
      (item: B2bExtraFieldsProps) => item.visibleToEnduser
    )

    const formattedUserExtraFields =
      handleConversionExtraItemFormat(visibleFields)

    userExtraFieldsList = formattedUserExtraFields
  } catch (err) {
    console.error(err)
  }

  return userExtraFieldsList
}

export default getB2BUserExtraFields
