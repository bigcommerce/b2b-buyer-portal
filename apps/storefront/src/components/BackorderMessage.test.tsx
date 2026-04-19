import { buildGlobalStateWith, renderWithProviders, screen } from 'tests/test-utils';

import BackorderMessage from './BackorderMessage';

const withAllBackorderDisplayEnabled = {
  preloadedState: {
    global: buildGlobalStateWith({
      backorderDisplaySettings: {
        showQuantityOnBackorder: true,
        showQuantityOnHand: true,
        showBackorderMessage: true,
      },
    }),
  },
};

describe('BackorderMessage', () => {
  it('renders nothing when quantityBackordered is 0', () => {
    renderWithProviders(
      <BackorderMessage quantityBackordered={0} backorderMessage="Lead time 2-4 weeks" visible />,
    );

    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
    expect(screen.queryByText('ready to ship', { exact: false })).toBeNull();
  });

  it('renders nothing when quantityBackordered is undefined', () => {
    renderWithProviders(<BackorderMessage backorderMessage="Lead time 2-4 weeks" visible />);

    expect(screen.queryByText('will be backordered', { exact: false })).toBeNull();
    expect(screen.queryByText('ready to ship', { exact: false })).toBeNull();
  });

  it('renders only the backordered line when totalOnHand is 0', () => {
    renderWithProviders(
      <BackorderMessage
        totalOnHand={0}
        quantityBackordered={5}
        backorderMessage="Lead time 2-4 weeks"
        visible
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('ready to ship', { exact: false })).toBeNull();
    expect(screen.getByText('5 will be backordered')).toBeVisible();
    expect(screen.getByText('Lead time 2-4 weeks')).toBeVisible();
  });

  it('renders both lines when some items are on hand', () => {
    renderWithProviders(
      <BackorderMessage
        totalOnHand={2}
        quantityBackordered={3}
        backorderMessage="Lead time 2-4 weeks"
        visible
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.getByText('2 ready to ship')).toBeVisible();
    expect(screen.getByText('3 will be backordered')).toBeVisible();
    expect(screen.getByText('Lead time 2-4 weeks')).toBeVisible();
  });

  it('is visible when visible is true', () => {
    renderWithProviders(
      <BackorderMessage quantityBackordered={3} backorderMessage="Lead time 2-4 weeks" visible />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.getByText('3 will be backordered')).toBeVisible();
  });

  it('renders nothing when visible is false', () => {
    renderWithProviders(
      <BackorderMessage
        quantityBackordered={3}
        backorderMessage="Lead time 2-4 weeks"
        visible={false}
      />,
      withAllBackorderDisplayEnabled,
    );

    expect(screen.queryByText('3 will be backordered')).toBeNull();
    expect(screen.queryByText('Lead time 2-4 weeks')).toBeNull();
  });
});
