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

const baseProps: MessageComponentProps = {
  id: 1,
  status: 0,
  isB2BUser: false,
  email: 'buyer@example.com',
  msgs: [],
};

const ownerMessage = {
  date: 1_700_000_000,
  message: 'Hi, I need help with this quote',
  role: 'Customer: Gary Kumar',
  read: 1,
};

const otherUserMessage = {
  date: 1_700_000_010,
  message: 'Can we get a discount?',
  role: 'Customer: Alice Tester',
  read: 1,
};

const salesRepMessage = {
  date: 1_700_000_020,
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

describe('Message per-sender attribution (flag enabled)', () => {
  beforeEach(() => {
    mockedUpdateQuote.mockResolvedValue({
      quoteUpdate: { quote: { trackingHistory: [] } },
    });
  });

  it('shows a separate label when a different customer sends a message', async () => {
    await renderAndExpand(
      { ...baseProps, msgs: [ownerMessage, otherUserMessage] },
      withSenderNameFlag(true),
    );

    expect(screen.getByText('Customer: Gary Kumar')).toBeVisible();
    expect(screen.getByText('Customer: Alice Tester')).toBeVisible();
  });

  it('does not repeat the label for consecutive messages from the same sender', async () => {
    const secondOwnerMessage = {
      ...ownerMessage,
      date: 1_700_000_005,
      message: 'Following up on this',
    };

    await renderAndExpand(
      { ...baseProps, msgs: [ownerMessage, secondOwnerMessage] },
      withSenderNameFlag(true),
    );

    const labels = screen.getAllByText('Customer: Gary Kumar');
    expect(labels).toHaveLength(1);
  });

  it('leaves the sales rep label untouched', async () => {
    await renderAndExpand(
      { ...baseProps, msgs: [ownerMessage, salesRepMessage] },
      withSenderNameFlag(true),
    );

    expect(screen.getByText('Sales rep: Bob Rep')).toBeVisible();
  });
});

describe('Message sender grouping (flag off / default)', () => {
  beforeEach(() => {
    mockedUpdateQuote.mockResolvedValue({
      quoteUpdate: { quote: { trackingHistory: [] } },
    });
  });

  it('groups consecutive customer messages under one label (old behavior)', async () => {
    await renderAndExpand(
      { ...baseProps, msgs: [ownerMessage, otherUserMessage] },
      withSenderNameFlag(false),
    );

    expect(screen.getByText('Customer: Gary Kumar')).toBeVisible();
    expect(screen.queryByText('Customer: Alice Tester')).toBeNull();
  });

  it('keeps the old behavior when the flag has never been set', async () => {
    await renderAndExpand({
      ...baseProps,
      msgs: [ownerMessage, otherUserMessage],
    });

    expect(screen.getByText('Customer: Gary Kumar')).toBeVisible();
    expect(screen.queryByText('Customer: Alice Tester')).toBeNull();
  });
});
