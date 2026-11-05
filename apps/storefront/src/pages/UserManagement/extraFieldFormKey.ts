import { Base64 } from '@/utils/base64';

// Extra field names are merchant-defined. react-hook-form reads a field name as a path, so "." "["
// "]" quotes and "|" in a name are rewritten, and different names can end up as the same path
// ("[A] B" and "A B", or "A" and "A. B"). Registering the form field under an encoded key avoids
// all of that: the key only contains letters, digits and "+/=", and it is unique per name.
// The prefix keeps it from ever matching a built-in field key such as "phone" or "email".
const EXTRA_FIELD_FORM_KEY_PREFIX = 'extraField_';

export const toExtraFieldFormKey = (fieldName: string) =>
  `${EXTRA_FIELD_FORM_KEY_PREFIX}${Base64.encode(fieldName)}`;

export const fromExtraFieldFormKey = (formKey: string) =>
  Base64.decode(formKey.slice(EXTRA_FIELD_FORM_KEY_PREFIX.length));
