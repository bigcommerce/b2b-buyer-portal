import * as bcService from '@/shared/service/bc';

import b2bLogger from './b3Logger';
import { fetchCurrentCustomerJwt, isCustomerJwtValid } from './currentCustomerJwt';

describe('currentCustomerJwt helpers', () => {
  beforeEach(() => {
    vi.spyOn(b2bLogger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCurrentCustomerJwt', () => {
    it('returns the fetched JWT', async () => {
      vi.spyOn(bcService, 'getCurrentCustomerJWT').mockResolvedValue('jwt-token');

      await expect(fetchCurrentCustomerJwt()).resolves.toBe('jwt-token');
    });

    it('returns an empty string and logs when the fetch fails', async () => {
      vi.spyOn(bcService, 'getCurrentCustomerJWT').mockRejectedValue(new Error('network'));

      await expect(fetchCurrentCustomerJwt()).resolves.toBe('');
      expect(b2bLogger.error).toHaveBeenCalled();
    });
  });

  describe('isCustomerJwtValid', () => {
    it('treats a present token as valid and an empty token as invalid', () => {
      expect(isCustomerJwtValid('jwt-token')).toBe(true);
      expect(isCustomerJwtValid('')).toBe(false);
    });
  });
});
