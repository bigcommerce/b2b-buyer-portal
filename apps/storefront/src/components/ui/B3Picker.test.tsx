import { faker } from '@faker-js/faker';
import {
  buildGlobalStateWith,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from 'tests/test-utils';

import { B3Picker } from './B3Picker';

const FLAG = 'LOCAL-3509.Translate_b2b_dates';
const STORE_URL = faker.internet.url({ appendSlash: false });

const buildGlobalState = (isEnabled: boolean, code: string) =>
  buildGlobalStateWith({
    featureFlags: { [FLAG]: isEnabled },
    locales: [
      { code: 'en', isDefault: true, fullPath: `${STORE_URL}/` },
      { code, isDefault: false, fullPath: `${STORE_URL}/${code}` },
    ],
  });

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('B3Picker', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('shows a German calendar and date format on a German storefront path', async () => {
    setHref(`${STORE_URL}/de/orders`);
    const label = faker.lorem.word();
    const onChange = vi.fn();

    renderWithProviders(<B3Picker label={label} value="2024-03-15" onChange={onChange} />, {
      preloadedState: { global: buildGlobalState(true, 'de') },
    });

    const input = screen.getByRole('textbox', { name: label });

    expect(input).toHaveValue('15.03.2024');

    await userEvent.click(input);

    expect(await screen.findByRole('button', { name: 'Letzter Monat' })).toBeInTheDocument();
    expect(screen.getByText('März 2024')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toStrictEqual([
      'M',
      'D',
      'M',
      'D',
      'F',
      'S',
      'S',
    ]);
  });

  it('emits the unchanged YYYY-MM-DD value when the user picks a day in German', async () => {
    setHref(`${STORE_URL}/de/orders`);
    const label = faker.lorem.word();
    const onChange = vi.fn();

    renderWithProviders(<B3Picker label={label} value="2024-03-15" onChange={onChange} />, {
      preloadedState: { global: buildGlobalState(true, 'de') },
    });

    await userEvent.click(screen.getByRole('textbox', { name: label }));
    await userEvent.click(await screen.findByRole('gridcell', { name: '20' }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('2024-03-20'));
  });

  it('keeps the English calendar when the date localization flag is off', async () => {
    setHref(`${STORE_URL}/de/orders`);
    const label = faker.lorem.word();

    renderWithProviders(<B3Picker label={label} value="2024-03-15" onChange={vi.fn()} />, {
      preloadedState: { global: buildGlobalState(false, 'de') },
    });

    const input = screen.getByRole('textbox', { name: label });

    expect(input).toHaveValue('03/15/2024');

    await userEvent.click(input);

    expect(await screen.findByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toStrictEqual([
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
  });
});
