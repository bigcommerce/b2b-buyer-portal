interface FromArrValues {
  [key: string]: string | number;
}

type Serializer = (file: HTMLInputElement, formObjVal: FromArrValues) => FromArrValues;

const denyInputType = ['button', 'file', 'reset', 'hidden', 'submit'];
const serializeType = ['checkbox', 'radio'];

const serializeAction: Serializer = (file, formObjVal) => {
  const { name, type, checked } = file;
  let { value } = file;

  if (serializeType.includes(type)) {
    if (type === 'radio' && !checked) return {};

    return { [name]: checked ? value : '' };
  }

  if (formObjVal[name]) {
    value = `${formObjVal[name]}, ${value}`;
  }

  return { [name]: value };
};

export const serialize = (form: HTMLFormElement) => {
  const formElement = [...form.elements] as HTMLInputElement[];
  const formValue = formElement.reduce(
    (previousValue: FromArrValues, currentValue: HTMLInputElement) => {
      if (
        currentValue.type &&
        !denyInputType.includes(currentValue.type) &&
        !currentValue.disabled
      ) {
        const result = serializeAction(currentValue, previousValue);
        return { ...previousValue, ...result };
      }
      return previousValue;
    },
    {},
  );

  return formValue;
};

export default serialize;
