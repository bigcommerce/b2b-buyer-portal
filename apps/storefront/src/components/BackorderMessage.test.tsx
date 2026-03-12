import { renderWithProviders, screen } from 'tests/test-utils';
import { describe, expect, it } from 'vitest';

import BackorderMessage from './BackorderMessage';

describe('BackorderMessage', () => {
  it('renders nothing when quantityBackordered is 0', () => {
    renderWithProviders(
      <BackorderMessage quantityBackordered={0} backorderMessage="Lead time 2-4 weeks" />,
    );

    expect(screen.queryByText(/will be backordered/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to ship/)).not.toBeInTheDocument();
  });

  it('renders nothing when quantityBackordered is undefined', () => {
    renderWithProviders(<BackorderMessage backorderMessage="Lead time 2-4 weeks" />);

    expect(screen.queryByText(/will be backordered/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to ship/)).not.toBeInTheDocument();
  });

  it('renders only the backordered line when totalOnHand is 0', () => {
    renderWithProviders(
      <BackorderMessage
        totalOnHand={0}
        quantityBackordered={5}
        backorderMessage="Lead time 2-4 weeks"
      />,
    );

    expect(screen.queryByText(/ready to ship/)).not.toBeInTheDocument();
    expect(screen.getByText('5 will be backordered')).toBeInTheDocument();
    expect(screen.getByText('Lead time 2-4 weeks')).toBeInTheDocument();
  });

  it('renders both lines when some items are on hand', () => {
    renderWithProviders(
      <BackorderMessage
        totalOnHand={2}
        quantityBackordered={3}
        backorderMessage="Lead time 2-4 weeks"
      />,
    );

    expect(screen.getByText('2 ready to ship')).toBeInTheDocument();
    expect(screen.getByText('3 will be backordered')).toBeInTheDocument();
    expect(screen.getByText('Lead time 2-4 weeks')).toBeInTheDocument();
  });

  it('is visible by default', () => {
    renderWithProviders(
      <BackorderMessage quantityBackordered={3} backorderMessage="Lead time 2-4 weeks" />,
    );

    expect(screen.getByText('3 will be backordered').closest('div')).toHaveStyle({
      visibility: 'visible',
    });
  });

  it('is hidden when visible is false', () => {
    renderWithProviders(
      <BackorderMessage
        quantityBackordered={3}
        backorderMessage="Lead time 2-4 weeks"
        visible={false}
      />,
    );

    expect(screen.getByText('3 will be backordered').closest('div')).toHaveStyle({
      visibility: 'hidden',
    });
  });
});
