import {
  buildB2BFeaturesStateWith,
  buildCompanyStateWith,
  buildDraftQuoteItemWith,
  buildGlobalStateWith,
  buildQuoteInfoStateWith,
  graphql,
  HttpResponse,
  renderWithProviders,
  screen,
  startMockServer,
  userEvent,
  waitFor,
} from 'tests/test-utils';

import B3MasqueradeGlobalTip from './B3MasqueradeGlobalTip';

const { server } = startMockServer();

const masqueradingState = {
  company: buildCompanyStateWith({ customer: { id: 123, b2bId: 456 } }),
  b2bFeatures: buildB2BFeaturesStateWith({
    masqueradeCompany: { id: 7, isAgenting: true, companyName: 'Acme' },
  }),
  global: buildGlobalStateWith({ cartNumber: 0, isPageComplete: true }),
};

describe('when ending masquerade from the global tip with an empty cart but a non-empty draft quote', () => {
  it('shows the end-masquerade confirmation', async () => {
    // given - masquerading, empty cart, a draft quote with an item
    const draftQuote = buildQuoteInfoStateWith({
      draftQuoteList: [buildDraftQuoteItemWith('WHATEVER_VALUES')],
    });

    renderWithProviders(<B3MasqueradeGlobalTip isOpen={false} setOpenPage={vi.fn()} />, {
      preloadedState: { ...masqueradingState, quoteInfo: draftQuote },
    });

    // when
    await userEvent.click(screen.getByText('END MASQUERADE'));

    // then
    expect(
      await screen.findByText(
        'This action will empty your shopping cart and draft quote. Do you want to continue?',
      ),
    ).toBeInTheDocument();
  });

  it('empties the draft quote on confirm', async () => {
    // given
    const endMasquerade = vi.fn().mockReturnValue({});
    server.use(
      graphql.mutation('EndMasquerade', ({ query }) => HttpResponse.json(endMasquerade(query))),
    );

    const draftQuote = buildQuoteInfoStateWith({
      draftQuoteList: [buildDraftQuoteItemWith('WHATEVER_VALUES')],
      draftQuoteInfo: { contactInfo: { companyName: 'Company A' } },
    });

    const { store } = renderWithProviders(
      <B3MasqueradeGlobalTip isOpen={false} setOpenPage={vi.fn()} />,
      { preloadedState: { ...masqueradingState, quoteInfo: draftQuote } },
    );

    // when
    await userEvent.click(screen.getByText('END MASQUERADE'));
    await userEvent.click(await screen.findByRole('button', { name: /Continue/ }));

    // then
    await waitFor(() => {
      expect(store.getState().quoteInfo.draftQuoteList).toHaveLength(0);
    });
    expect(store.getState().quoteInfo.draftQuoteInfo.contactInfo.companyName).toBe('');
  });
});
