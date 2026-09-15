import { ReactNode } from 'react';
import {
  buildCompanyStateWith,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from 'tests/test-utils';
import { vi } from 'vitest';

import { guestProductsBulkUploadCSV } from '@/shared/service/b2b';
import { CustomerRole } from '@/types';

import { B3Upload } from './B3Upload';

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  guestProductsBulkUploadCSV: vi.fn(),
}));

// The storefront's real channel is rarely 1 (the default channel) — this proves the
// guest upload flow carries the actual channel through instead of silently dropping it.
vi.mock('@/utils/basicConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/basicConfig')>()),
  channelId: 555,
}));

vi.mock('react-mui-dropzone', () => ({
  DropzoneArea: ({ onChange }: { onChange: (files: File[]) => void }) => (
    <input
      type="file"
      aria-label="csv upload"
      onChange={(event) => onChange(Array.from(event.target.files ?? []))}
    />
  ),
}));

// B3Dialog only opens its MUI Dialog once a ref-driven container is available, which
// depends on unrelated rerender timing (see useMobile's feature-flagged effect). That's
// irrelevant to this test's concern (whether the guest upload payload carries channelId),
// so render the dialog's children directly instead of the real modal/portal chrome.
vi.mock('../B3Dialog', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockedGuestProductsBulkUploadCSV = vi.mocked(guestProductsBulkUploadCSV);

describe('B3Upload', () => {
  it('sends the storefront channelId for guest bulk uploads, so SKU validation runs against the correct channel catalog', async () => {
    mockedGuestProductsBulkUploadCSV.mockResolvedValue({
      result: {
        validProduct: [],
        errorProduct: [],
        errorFile: '',
        stockErrorFile: '',
        stockErrorSkus: [],
      },
    });

    renderWithProviders(<B3Upload isOpen setIsOpen={vi.fn()} handleAddToList={vi.fn()} />, {
      preloadedState: {
        company: buildCompanyStateWith({
          customer: { role: CustomerRole.GUEST },
        }),
      },
    });

    const csvFile = new File(['SKU,Qty\nSKU1,1\n'], 'upload.csv', { type: 'text/csv' });

    await userEvent.upload(screen.getByLabelText('csv upload'), csvFile);

    await waitFor(() => {
      expect(mockedGuestProductsBulkUploadCSV).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: 555 }),
      );
    });
  });
});
