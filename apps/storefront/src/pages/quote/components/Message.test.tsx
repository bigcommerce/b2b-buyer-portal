import { format } from 'date-fns';
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
  role: 'Contact: Quote Owner',
  read: 1,
};

const otherUserMessage = {
  date: 1_700_000_010,
  message: 'Can we get a discount?',
  role: 'Customer: Jane Buyer',
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

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
    expect(screen.getByText('Customer: Jane Buyer')).toBeVisible();
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

    const labels = screen.getAllByText('Contact: Quote Owner');
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

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
    expect(screen.queryByText('Customer: Jane Buyer')).toBeNull();
  });

  it('keeps the old behavior when the flag has never been set', async () => {
    await renderAndExpand({
      ...baseProps,
      msgs: [ownerMessage, otherUserMessage],
    });

    expect(screen.getByText('Contact: Quote Owner')).toBeVisible();
    expect(screen.queryByText('Customer: Jane Buyer')).toBeNull();
  });
});

describe('Message relative time (LOCAL-3509.Translate_b2b_dates enabled)', () => {
  const originalLocation = window.location;

  const visitStorefront = (code: string) => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: `https://store.example.com/${code}` },
      writable: true,
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  const storefront = (code: string, dateLocalization: boolean) => ({
    preloadedState: {
      global: buildGlobalStateWith({
        featureFlags: {
          'LOCAL-3191.B2B_multi_language': true,
          'LOCAL-3509.Translate_b2b_dates': dateLocalization,
        },
        locales: [
          { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
          { code, isDefault: false, fullPath: `https://store.example.com/${code}` },
        ],
      }),
    },
  });

  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;

  it('shows how long ago a message was sent in French', async () => {
    visitStorefront('fr');
    renderWithProviders(
      <Message {...baseProps} msgs={[{ ...ownerMessage, date: fiveMinutesAgo }]} />,
      storefront('fr', true),
    );
    await userEvent.click(await screen.findByText('Message'));

    expect(await screen.findByText(/il y a 5 minutes/)).toBeVisible();
  });

  it('keeps the English relative time for a language the portal ships no translations for', async () => {
    visitStorefront('uk');
    renderWithProviders(
      <Message {...baseProps} msgs={[{ ...ownerMessage, date: fiveMinutesAgo }]} />,
      storefront('uk', true),
    );
    await userEvent.click(await screen.findByText('Message'));

    expect(await screen.findByText(/5 minutes ago/)).toBeVisible();
  });

  it('keeps the English relative time when the flag is off', async () => {
    visitStorefront('fr');
    renderWithProviders(
      <Message {...baseProps} msgs={[{ ...ownerMessage, date: fiveMinutesAgo }]} />,
      storefront('fr', false),
    );
    await userEvent.click(await screen.findByText('Message'));

    expect(await screen.findByText(/5 minutes ago/)).toBeVisible();
  });

  it('keeps the legacy sent time on an English storefront when the flag is on', async () => {
    visitStorefront('en');
    const sentAt = new Date(fiveMinutesAgo * 1000);
    renderWithProviders(
      <Message {...baseProps} msgs={[{ ...ownerMessage, date: fiveMinutesAgo }]} />,
      storefront('en', true),
    );
    await userEvent.click(await screen.findByText('Message'));

    await userEvent.hover(await screen.findByText(ownerMessage.message));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(format(sentAt, 'K:m aa'));
  });
});
