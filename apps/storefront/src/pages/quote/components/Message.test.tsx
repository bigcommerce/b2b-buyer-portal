import { buildGlobalStateWith, renderWithProviders, screen, userEvent } from 'tests/test-utils';
import { vi } from 'vitest';

import { updateQuote } from '@/shared/service/b2b';

import Message from './Message';

type MessageComponentProps = Parameters<typeof Message>[0];

vi.mock('@/shared/service/b2b', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/service/b2b')>()),
  updateQuote: vi.fn(),
}));

const mockedUpdateQuote = vi.mocked(updateQuote);

const baseProps: Omit<MessageComponentProps, 'msgs' | 'currentUserName'> = {
  id: 1,
  status: 0,
  isB2BUser: false,
  email: 'buyer@example.com',
};

const customerMessage = {
  date: 1_700_000_000,
  message: 'Hi, I need help with this quote',
  role: 'Contact: Quote Owner',
  read: 1,
};

const salesRepMessage = {
  date: 1_700_000_010,
  message: 'Sure, one moment',
  role: 'Sales rep: Bob Rep',
  read: 1,
};

const withSenderNameFlag = (enabled: boolean) => ({
  preloadedState: {
    global: buildGlobalStateWith({
      featureFlags: {
        'B2B-2219.fix_buyer_portal_quote_message_sender_name': enabled,
      },
    }),
  },
});

async function renderAndExpand(
  props: MessageComponentProps,
  renderOptions?: ReturnType<typeof withSenderNameFlag>,
) {
  const view = renderWithProviders(<Message {...props} />, renderOptions);
  await userEvent.click(screen.getByText('Message'));
  return view;
}

describe('Message sender name (B2B-2219.fix_buyer_portal_quote_message_sender_name enabled)', () => {
  beforeEach(() => {
    mockedUpdateQuote.mockResolvedValue({
      quoteUpdate: { quote: { trackingHistory: [] } },
    });
  });

  it("shows the logged-in user's own name instead of the quote contact for the buyer's messages", async () => {
    await renderAndExpand(
      {
        ...baseProps,
        msgs: [customerMessage],
        currentUserName: 'Jane Buyer',
      },
      withSenderNameFlag(true),
    );

    expect(screen.getByText('Jane Buyer')).toBeVisible();
    expect(screen.queryByText('Contact: Quote Owner')).toBeNull();
  });

  it('falls back to the original backend-provided label when no current user name is available', async () => {
    await renderAndExpand(
      {
        ...baseProps,
        msgs: [customerMessage],
        currentUserName: '',
      },
      withSenderNameFlag(true),
    );

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
  });

  it('leaves the sales rep label untouched', async () => {
    await renderAndExpand(
      {
        ...baseProps,
        msgs: [customerMessage, salesRepMessage],
        currentUserName: 'Jane Buyer',
      },
      withSenderNameFlag(true),
    );

    expect(screen.getByText('Sales rep: Bob Rep')).toBeVisible();
  });
});

describe('Message sender name (flag off, including the default/unset state)', () => {
  beforeEach(() => {
    mockedUpdateQuote.mockResolvedValue({
      quoteUpdate: { quote: { trackingHistory: [] } },
    });
  });

  it('keeps the original backend-provided label even when a current user name is available', async () => {
    await renderAndExpand(
      {
        ...baseProps,
        msgs: [customerMessage],
        currentUserName: 'Jane Buyer',
      },
      withSenderNameFlag(false),
    );

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
    expect(screen.queryByText('Jane Buyer')).toBeNull();
  });

  it('keeps the original backend-provided label when the flag has never been set (default state)', async () => {
    await renderAndExpand({
      ...baseProps,
      msgs: [customerMessage],
      currentUserName: 'Jane Buyer',
    });

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
    expect(screen.queryByText('Jane Buyer')).toBeNull();
  });
});
