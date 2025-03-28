interface BaseField {
  id: string;
  label: string;
  name: string;
  readonly: boolean;
}

interface TextField extends BaseField {
  type: 'text';
  required: boolean;
  value: string;
  maxLength?: number;
}

interface MultilineField extends BaseField {
  type: 'multiline';
  required: boolean;
  value: string;
  rows: number;
}

interface NumberOnlyField extends BaseField {
  type: 'numberOnly';
  required: boolean;
  value: number;
  min?: number;
  max?: number;
}

interface DropdownField extends BaseField {
  type: 'dropdown';
  required: boolean;
  value: string;
  options: string[];
  instructions?: string;
}

interface CheckboxGroupField extends BaseField {
  type: 'checkboxGroup';
  atLeastOneMustBeChecked: boolean;
  checkboxes: Array<{ name: string; checked: boolean }>;
}

interface DateField extends BaseField {
  type: 'date';
  required: boolean;
  value?: Date;
  defaultValue?: Date;
  range?: { min: Date; max: Date };
}

interface RadioField extends BaseField {
  type: 'radio';
  required: boolean;
  value?: string;
  options: string[];
}

type UpdatedField =
  | Pick<
      TextField | MultilineField | NumberOnlyField | DropdownField | DateField | RadioField,
      'name' | 'value'
    >
  | Pick<CheckboxGroupField, 'name' | 'checkboxes'>;

interface UpdatedFields {
  // do we want explicitly name standard fields, "firstName", "lastName", etc?
  standardFields: UpdatedField[];
  // if we combine these into "customFields" we could hit name collisions, e.g. both have a "My Field" field
  b2bFields: UpdatedField[];
  bcFields: UpdatedField[];
}

type Save = (updatedFields: UpdatedFields) => Promise<void>;

type EmailIsUnique = (email: string) => Promise<boolean>;

type Field =
  | TextField
  | MultilineField
  | NumberOnlyField
  | DropdownField
  | CheckboxGroupField
  | DateField
  | RadioField;

export interface Props {
  fields: {
    standardFields: Field[];
    b2bFields: Field[];
    bcFields: Field[];
  };
  save: Save;
  emailIsUnique: EmailIsUnique;
}
