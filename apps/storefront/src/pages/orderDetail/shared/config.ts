export const getReturnFormFields = () => [
  {
    name: 'return_reason',
    label: 'Return reason',
    required: true,
    xs: 12,
    variant: 'filled',
    size: 'small',
    fieldType: 'dropdown',
    default: '',
    options: [
      {
        label: 'Received Wrong Product', value: 'Received Wrong Product',
      },
      {
        label: 'Wrong Product Ordered', value: 'Wrong Product Ordered',
      },
      {
        label: 'Not Satisfied With The Product', value: 'Not Satisfied With The Product',
      },
      {
        label: 'There Was A Problem With The Product', value: 'There Was A Problem With The Product',
      },
    ],
  }, {
    name: 'return_action',
    label: 'Return action',
    required: true,
    xs: 12,
    variant: 'filled',
    size: 'small',
    fieldType: 'dropdown',
    default: '',
    options: [
      {
        label: 'Repair', value: 'Repair',
      },
      {
        label: 'Replacement', value: 'Replacement',
      },
      {
        label: 'Store Credit', value: 'Store Credit',
      },
    ],
  }, {
    name: 'return_comments',
    label: 'Comment',
    required: true,
    xs: 12,
    rows: 5,
    variant: 'filled',
    size: 'small',
    fieldType: 'multiline',
    default: '',
  },
]
