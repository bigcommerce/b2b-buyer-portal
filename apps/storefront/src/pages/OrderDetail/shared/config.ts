const getReturnFormFields = () => [
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
        label: 'Received Wrong Product',
        value: 'Received wrong product',
      },
      {
        label: 'Wrong Product Ordered',
        value: 'Wrong product ordered',
      },
      {
        label: 'Not Satisfied With The Product',
        value: 'Not satisfied with the product',
      },
      {
        label: 'There Was A Problem With The Product',
        value: 'There was a problem with the product',
      },
    ],
  },
  {
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
        label: 'Repair',
        value: 'Repair',
      },
      {
        label: 'Replacement',
        value: 'Replacement',
      },
      {
        label: 'Store Credit',
        value: 'Store credit',
      },
    ],
  },
  {
    name: 'return_comments',
    label: 'Comment',
    required: false,
    xs: 12,
    rows: 5,
    variant: 'filled',
    size: 'small',
    fieldType: 'multiline',
    default: '',
  },
];

export default getReturnFormFields;
