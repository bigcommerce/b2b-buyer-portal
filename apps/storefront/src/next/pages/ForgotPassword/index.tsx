/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { View } from './view';
import { withinModal } from '@/next/withinModal';
import { resetPassword } from './resetPassword';

// Currently a passthrough component as there is no I/O
export const ForgotPassword: FC = () => <View resetPassword={resetPassword} />;

export default withinModal(ForgotPassword);
