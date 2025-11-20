import { PropsWithChildren } from 'react';

import { type SetOpenPage } from '@/pages/SetOpenPage';

import RegisteredCloseButton from './RegisteredCloseButton';
import { CardContainer } from './styled';

export function B3Card(props: PropsWithChildren<{ setOpenPage?: SetOpenPage }>) {
  const { setOpenPage, children } = props;

  return (
    <CardContainer>
      {setOpenPage && <RegisteredCloseButton setOpenPage={setOpenPage} />}
      {children}
    </CardContainer>
  );
}
