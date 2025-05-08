/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { View } from './view';
import { withinModal } from '@/next/withinModal';

// Currently a passthrough component as there is no I/O
export const ForgotPassword: FC = () => <View />;

export default withinModal(ForgotPassword);
