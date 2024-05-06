import { LangProvider } from '@b3/lang';
import { describe, expect, it } from 'vitest';

import { B3Table } from '@/components';
import { TableColumnItem } from '@/components/table/B3Table';
import lang from '@/store/slices/lang';

import { renderWithProviders } from '../../test-utils';

const columnItems: TableColumnItem<1> = {
  key: 'key test1',
  title: 'title test',
};

const listItems = [
  {
    node: {
      id: 1,
    },
  },
];

describe('B3Table component', async () => {
  it('renders correctly', () => {
    renderWithProviders(
      <LangProvider customText={{ 'global.pagination.of': 'test-of' }}>
        <B3Table
          tableFixed
          columnItems={[columnItems]}
          listItems={listItems}
          pagination={{
            offset: 0,
            count: 0,
            first: 10,
          }}
          rowsPerPageOptions={[10, 20, 50]}
          showPagination
          labelRowsPerPage="cards per page"
        />
      </LangProvider>,
      {
        reducer: { lang },
      },
    );
  });

  it('matching b3table with snapshot', () => {
    const { result } = renderWithProviders(
      <LangProvider customText={{ 'global.pagination.of': 'test-of' }}>
        <B3Table
          tableFixed
          columnItems={[columnItems]}
          listItems={listItems}
          pagination={{
            offset: 0,
            count: 0,
            first: 10,
          }}
          rowsPerPageOptions={[10, 20, 50]}
          showPagination
          labelRowsPerPage="cards per page"
          isInfiniteScroll={false}
          isCustomRender={false}
        />
      </LangProvider>,
      {
        reducer: { lang },
      },
    );
    expect(result).toMatchSnapshot();
  });
});
