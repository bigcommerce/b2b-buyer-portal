import { B3Table } from '@/components';
import { TableColumnItem } from '@/components/table/B3Table';
import { renderWithProviders } from 'tests/test-utils';

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
      <B3Table
        columnItems={[columnItems]}
        labelRowsPerPage="cards per page"
        listItems={listItems}
        pagination={{
          offset: 0,
          count: 0,
          first: 10,
        }}
        rowsPerPageOptions={[10, 20, 50]}
        showPagination
        tableFixed
      />,
    );
  });
});
