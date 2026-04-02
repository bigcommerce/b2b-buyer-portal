import { type PageProps } from '../PageProps';
import { RegisteredProvider } from '../Registered/Context';

import { Register } from './Register';

export default function RegisteredBCToB2BPage(props: PageProps) {
  return (
    <RegisteredProvider>
      <Register {...props} />
    </RegisteredProvider>
  );
}
