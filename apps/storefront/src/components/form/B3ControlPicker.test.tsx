import { useForm } from 'react-hook-form';
import { faker } from '@faker-js/faker';
import {
  buildGlobalStateWith,
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from 'tests/test-utils';

import { B3CustomForm } from '../B3CustomForm';

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

interface DateFormProps {
  label: string;
  name: string;
  defaultValue?: string;
  onSubmit: (values: Record<string, string>) => void;
}

function DateForm({ label, name, defaultValue, onSubmit }: DateFormProps) {
  const {
    control,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({ mode: 'all' });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <B3CustomForm
        formFields={[{ name, label, fieldType: 'date', default: defaultValue, xs: 12 }]}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />
      <button type="submit">Send</button>
    </form>
  );
}

describe('B3ControlPicker', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('shows the stored date in the German format on a German storefront path', () => {
    setHref(`${STORE_URL}/de/register`);
    const label = faker.lorem.word();

    renderWithProviders(
      <DateForm label={label} name="birthday" defaultValue="2024-03-15" onSubmit={vi.fn()} />,
      { preloadedState: { global: buildGlobalState(true, 'de') } },
    );

    expect(screen.getByRole('textbox', { name: label })).toHaveValue('15.03.2024');
  });

  it('shows a German calendar and submits the date as YYYY-MM-DD', async () => {
    setHref(`${STORE_URL}/de/register`);
    const label = faker.lorem.word();
    const onSubmit = vi.fn();

    renderWithProviders(
      <DateForm label={label} name="birthday" defaultValue="2024-03-15" onSubmit={onSubmit} />,
      { preloadedState: { global: buildGlobalState(true, 'de') } },
    );

    await userEvent.click(screen.getByRole('textbox', { name: label }));

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

    await userEvent.click(screen.getByRole('gridcell', { name: '20' }));

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: label })).toHaveValue('20.03.2024'),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toStrictEqual({ birthday: '2024-03-20' });
  });

  it('leaves the field empty when no date is set', () => {
    setHref(`${STORE_URL}/de/register`);
    const label = faker.lorem.word();

    renderWithProviders(<DateForm label={label} name="birthday" onSubmit={vi.fn()} />, {
      preloadedState: { global: buildGlobalState(true, 'de') },
    });

    expect(screen.getByRole('textbox', { name: label })).toHaveValue('');
  });

  it('keeps the raw stored value and English calendar when the date localization flag is off', async () => {
    setHref(`${STORE_URL}/de/register`);
    const label = faker.lorem.word();

    renderWithProviders(
      <DateForm label={label} name="birthday" defaultValue="2024-03-15" onSubmit={vi.fn()} />,
      { preloadedState: { global: buildGlobalState(false, 'de') } },
    );

    const input = screen.getByRole('textbox', { name: label });

    expect(input).toHaveValue('2024-03-15');

    await userEvent.click(input);

    expect(await screen.findByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
  });
});
