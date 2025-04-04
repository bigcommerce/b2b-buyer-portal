import { PropsWithChildren } from 'react';

import { type SetOpenPage } from '@/pages/SetOpenPage';

import RegisteredCloseButton from './RegisteredCloseButton';
import { CardContainer } from './styled';

export default function B3Card(props: PropsWithChildren<{ setOpenPage?: SetOpenPage }>) {
  const { setOpenPage, children } = props;

  return (
    <CardContainer aria-modal="true" role="dialog">
      {setOpenPage && <RegisteredCloseButton setOpenPage={setOpenPage} />}
      {children}
    </CardContainer>
  );
}
