/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { View } from './view';
import { withinModal } from '@/next/withinModal';

// Currently a passthrough component as there is no I/O

type ViewType = typeof View;
type CreateForgotPassword = (View: ViewType) => FC;

// Vitest won't let you mock imports used within another module
// i.e. you can't spy on View while testing this module
// you're forced to call through (and your test becomes coupled to the implementation)

// or

// you turn the unit under test into a kind of "factory" function (as here)

// ooooorr

// you think of these "Page" modules as more config than code
// either not testing them at all, or doing so in a more integration style via

export const createForgotPassword: CreateForgotPassword = (View) => () => <View />;

export default withinModal(createForgotPassword(View));
