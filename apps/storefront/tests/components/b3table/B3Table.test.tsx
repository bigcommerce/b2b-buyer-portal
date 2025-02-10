import { LangProvider } from '@b3/lang';
import { renderWithProviders } from 'tests/test-utils';

import { B3Table } from '@/components';
import { TableColumnItem } from '@/components/table/B3Table';

const columnItems: TableColumnItem<{ id: number }> = {
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
    );
  });
});
