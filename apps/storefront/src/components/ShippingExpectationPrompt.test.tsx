import { renderWithProviders, screen } from 'tests/test-utils';

import ShippingExpectationPrompt from './ShippingExpectationPrompt';

const message = 'We will ship in-stock items right away. Backordered items ship separately.';

const defaultProps = {
  backorderEnabled: true,
  hasBackorderedItems: true,
  showDefaultShippingExpectationPrompt: true,
  defaultShippingExpectationPrompt: message,
};

describe('ShippingExpectationPrompt', () => {
  it('renders the message when all conditions are met', () => {
    renderWithProviders(<ShippingExpectationPrompt {...defaultProps} />);

    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders nothing when backorders are disabled', () => {
    renderWithProviders(<ShippingExpectationPrompt {...defaultProps} backorderEnabled={false} />);

    expect(screen.queryByText(message)).toBeNull();
  });

  it('renders nothing when there are no backordered items', () => {
    renderWithProviders(
      <ShippingExpectationPrompt {...defaultProps} hasBackorderedItems={false} />,
    );

    expect(screen.queryByText(message)).toBeNull();
  });

  it('renders nothing when showDefaultShippingExpectationPrompt is false', () => {
    renderWithProviders(
      <ShippingExpectationPrompt {...defaultProps} showDefaultShippingExpectationPrompt={false} />,
    );

    expect(screen.queryByText(message)).toBeNull();
  });

  it('renders nothing when the prompt message is empty', () => {
    renderWithProviders(
      <ShippingExpectationPrompt {...defaultProps} defaultShippingExpectationPrompt="" />,
    );

    expect(screen.queryByText(message)).toBeNull();
  });
});
