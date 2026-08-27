import { builder, faker, graphql, HttpResponse, startMockServer } from 'tests/test-utils';

import { store } from '@/store';

import { LocalizableProduct, localizeProductSearchResults } from './localizedProductSearch';

const { server } = startMockServer();

const buildLocalizableProductWith = builder<LocalizableProduct>(() => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  productUrl: `/${faker.lorem.slug()}/`,
}));

interface LocalizedOption {
  entityId: number;
  displayName: string;
  values: Array<{ entityId: number; label: string }>;
}

const buildLocalizedProductNodeWith = builder(() => ({
  entityId: faker.number.int(),
  name: faker.commerce.productName(),
  path: `/${faker.lorem.slug()}/`,
  options: [] as LocalizedOption[],
}));

const buildLocalizedProductsResponseWith = (
  nodes: ReturnType<typeof buildLocalizedProductNodeWith>[],
) => ({
  data: {
    site: {
      products: {
        edges: nodes.map(({ options, ...product }) => ({
          node: {
            ...product,
            productOptions: {
              edges: options.map(({ values, ...option }) => ({
                node: {
                  ...option,
                  values: { edges: values.map((value) => ({ node: value })) },
                },
              })),
            },
          },
        })),
      },
    },
  },
});

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
];

const stubStoreState = (locales = LOCALES) =>
  vi.spyOn(store, 'getState').mockReturnValue({
    global: { locales, featureFlags: { 'LOCAL-3280.B2B_email_multi_language': true } },
    company: { tokens: { bcGraphqlToken: 'bc-graphql-token' } },
  } as unknown as ReturnType<typeof store.getState>);

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('localizeProductSearchResults', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  describe('when the shopper is browsing a non-default locale', () => {
    beforeEach(() => {
      setHref('https://store.example.com/fr/');
      stubStoreState();
    });

    it('replaces the product name with the translation from the storefront API', async () => {
      const product = buildLocalizableProductWith({ id: 123, name: 'Chair' });

      server.use(
        graphql.query('LocalizedProducts', () =>
          HttpResponse.json(
            buildLocalizedProductsResponseWith([
              buildLocalizedProductNodeWith({ entityId: 123, name: 'Chaise' }),
            ]),
          ),
        ),
      );

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized.name).toBe('Chaise');
    });

    it('prefixes the translated product path with the locale subfolder', async () => {
      const product = buildLocalizableProductWith({ id: 123, productUrl: '/chair/' });

      server.use(
        graphql.query('LocalizedProducts', () =>
          HttpResponse.json(
            buildLocalizedProductsResponseWith([
              buildLocalizedProductNodeWith({ entityId: 123, path: '/chaise/' }),
            ]),
          ),
        ),
      );

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized.productUrl).toBe('/fr/chaise/');
    });

    it('translates option names and option value labels shown to the shopper', async () => {
      const product = buildLocalizableProductWith({
        id: 123,
        options: [{ option_id: 7, display_name: 'Colour' }],
        optionsV3: [
          {
            id: 7,
            display_name: 'Colour',
            option_values: [{ id: 71, label: 'Red' }],
          },
        ],
        variants: [
          {
            option_values: [{ id: 71, label: 'Red', option_id: 7, option_display_name: 'Colour' }],
          },
        ],
      });

      server.use(
        graphql.query('LocalizedProducts', () =>
          HttpResponse.json(
            buildLocalizedProductsResponseWith([
              buildLocalizedProductNodeWith({
                entityId: 123,
                options: [
                  {
                    entityId: 7,
                    displayName: 'Couleur',
                    values: [{ entityId: 71, label: 'Rouge' }],
                  },
                ],
              }),
            ]),
          ),
        ),
      );

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized.options).toEqual([{ option_id: 7, display_name: 'Couleur' }]);
      expect(localized.optionsV3).toEqual([
        { id: 7, display_name: 'Couleur', option_values: [{ id: 71, label: 'Rouge' }] },
      ]);
      expect(localized.variants).toEqual([
        {
          option_values: [{ id: 71, label: 'Rouge', option_id: 7, option_display_name: 'Couleur' }],
        },
      ]);
    });

    it('translates modifier names and labels', async () => {
      const product = buildLocalizableProductWith({
        id: 123,
        modifiers: [
          {
            id: 9,
            type: 'dropdown',
            display_name: 'Engraving',
            option_values: [{ id: 91, label: 'None' }],
          },
        ],
      });

      server.use(
        graphql.query('LocalizedProducts', () =>
          HttpResponse.json(
            buildLocalizedProductsResponseWith([
              buildLocalizedProductNodeWith({
                entityId: 123,
                options: [
                  {
                    entityId: 9,
                    displayName: 'Gravure',
                    values: [{ entityId: 91, label: 'Aucune' }],
                  },
                ],
              }),
            ]),
          ),
        ),
      );

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized.modifiers).toEqual([
        {
          id: 9,
          type: 'dropdown',
          display_name: 'Gravure',
          option_values: [{ id: 91, label: 'Aucune' }],
        },
      ]);
    });

    it('keeps the original text for products the storefront API does not return', async () => {
      const product = buildLocalizableProductWith({ id: 123, name: 'Chair' });

      server.use(
        graphql.query('LocalizedProducts', () =>
          HttpResponse.json(buildLocalizedProductsResponseWith([])),
        ),
      );

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized).toEqual(product);
    });

    it('keeps the original text when the storefront API request fails', async () => {
      const product = buildLocalizableProductWith({ id: 123, name: 'Chair' });

      server.use(graphql.query('LocalizedProducts', () => HttpResponse.json({}, { status: 500 })));

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized).toEqual(product);
    });

    it('requests products in batches of 50 to stay within the storefront API page size', async () => {
      const products = Array.from({ length: 51 }, (_, index) =>
        buildLocalizableProductWith({ id: index + 1 }),
      );
      const requestedBatches: number[][] = [];

      server.use(
        graphql.query('LocalizedProducts', ({ variables }) => {
          requestedBatches.push(variables.entityIds);

          return HttpResponse.json(buildLocalizedProductsResponseWith([]));
        }),
      );

      await localizeProductSearchResults(products);

      expect(requestedBatches.map((batch) => batch.length).sort((a, b) => b - a)).toEqual([50, 1]);
    });
  });

  describe('when there is nothing to translate', () => {
    it('returns the products untouched on the default locale', async () => {
      setHref('https://store.example.com/');
      stubStoreState();
      const product = buildLocalizableProductWith({ id: 123, name: 'Chair' });

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized).toEqual(product);
    });

    it('returns the products untouched when multi-language is disabled', async () => {
      setHref('https://store.example.com/fr/');
      vi.spyOn(store, 'getState').mockReturnValue({
        global: { locales: LOCALES, featureFlags: {} },
        company: { tokens: { bcGraphqlToken: 'bc-graphql-token' } },
      } as unknown as ReturnType<typeof store.getState>);
      const product = buildLocalizableProductWith({ id: 123, name: 'Chair' });

      const [localized] = await localizeProductSearchResults([product]);

      expect(localized).toEqual(product);
    });
  });
});
