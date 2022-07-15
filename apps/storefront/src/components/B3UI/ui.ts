import { Control } from 'react-hook-form'

namespace B3UI {

  export interface B3CustomFormValue {
    name: string,
    fieldType: string,
    xs: number & undefined,
    [key: string]: string | Number | Array<Number | string>
  }

  export interface B3CustomFormProps {
    formFields?: {}[]
    [key: string]: any
  }

  export interface B3UIProps {
    control?: Control<B3CustomFormValue>
    [key: string]: any
  }

  export interface RadopGroupListProps {
    value: string,
    label: string,
    [key: string]: string,
  }
}

export default B3UI
