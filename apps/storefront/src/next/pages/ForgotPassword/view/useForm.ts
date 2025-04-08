import { useB3Lang } from '@b3/lang';
import { z } from 'zod';

import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const useForm = () => {
  const b3Lang = useB3Lang();

  const resolver = zodResolver(
    z.object({
      emailAddress: z
        .string()
        .min(1, { message: 'Email address is required' })
        .email(b3Lang('global.validatorRules.email')),
    }),
  );

  return useReactHookForm({ resolver });
};
