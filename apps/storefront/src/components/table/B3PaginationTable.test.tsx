import { screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

import { renderWithProviders } from '../../../tests/test-utils';
import { B3PaginationTable } from './B3PaginationTable';

describe('B3PaginationTable', () => {
  const mockGetRequestList = vi.fn(async () => ({
    edges: [
      { node: { id: 1, quantity: 2, disableCurrentCheckbox: false } },
      { node: { id: 2, quantity: 0, disableCurrentCheckbox: true } },
    ],
    totalCount: 2,
  }));

  beforeEach(() => {
    mockGetRequestList.mockClear();
  });

  function setupTable({
    isSelectOtherPageCheckbox = false,
    searchParams = { search: 'foo', createdBy: '' },
  }: {
    isSelectOtherPageCheckbox?: boolean;
    searchParams?: { search: string; createdBy: string };
  } = {}) {
    const ref = React.createRef<any>();
    const { result } = renderWithProviders(
      <B3PaginationTable
        ref={ref}
        columnItems={[]}
        getRequestList={mockGetRequestList}
        searchParams={searchParams}
        showCheckbox
        showSelectAllCheckbox
        isSelectOtherPageCheckbox={isSelectOtherPageCheckbox}
      />,
    );
    return { ref, result };
  }

  async function selectFirstRow(ref: React.RefObject<any>) {
    await act(async () => {
      ref.current.setList([{ node: { id: 1, quantity: 2, disableCurrentCheckbox: false } }]);
    });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    return checkboxes;
  }
  describe('selection logic WITHOUT FORCE_PRESERVE_SELECTION', () => {
    it('should clear selection and uncheck checkbox after refresh and param change', async () => {
      const { ref, result } = setupTable();
      const checkboxes = await selectFirstRow(ref);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh();
      });
      expect(mockGetRequestList).toHaveBeenCalledTimes(2);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([]);
      expect(checkboxes[1]).not.toBeChecked();
      result.rerender(
        <B3PaginationTable
          ref={ref}
          columnItems={[]}
          getRequestList={mockGetRequestList}
          searchParams={{ search: 'bar', createdBy: '' }}
          showCheckbox
          showSelectAllCheckbox
          isSelectOtherPageCheckbox={false}
        />,
      );
      await act(async () => {
        await ref.current.refresh();
      });
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([]);
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('should preserve selection and keep checkbox checked if isSelectOtherPageCheckbox is true', async () => {
      const { ref } = setupTable({ isSelectOtherPageCheckbox: true });
      const checkboxes = await selectFirstRow(ref);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh();
      });
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
    });
  });

  describe('selection logic WITH FORCE_PRESERVE_SELECTION', () => {
    it('should preserve selection and keep checkbox checked after refresh with FORCE_PRESERVE_SELECTION', async () => {
      const { ref } = setupTable();
      const checkboxes = await selectFirstRow(ref);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh('FORCE_PRESERVE_SELECTION');
      });
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
    });

    it('should preserve selection and keep checkbox checked after multiple refreshes with FORCE_PRESERVE_SELECTION', async () => {
      const { ref } = setupTable();
      const checkboxes = await selectFirstRow(ref);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh('FORCE_PRESERVE_SELECTION');
      });
      expect(mockGetRequestList).toHaveBeenCalledTimes(2);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
    });
  });

  describe('selection logic WITH FORCE_PRESERVE_SELECTION and isSelectOtherPageCheckbox', () => {
    it('should preserve selection and keep checkbox checked with FORCE_PRESERVE_SELECTION and isSelectOtherPageCheckbox true', async () => {
      const { ref } = setupTable({ isSelectOtherPageCheckbox: true });
      const checkboxes = await selectFirstRow(ref);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh('FORCE_PRESERVE_SELECTION');
      });
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
    });

    it('should preserve selection and keep checkbox checked after multiple refreshes with FORCE_PRESERVE_SELECTION and isSelectOtherPageCheckbox true', async () => {
      const { ref } = setupTable({ isSelectOtherPageCheckbox: true });
      const checkboxes = await selectFirstRow(ref);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
      await act(async () => {
        await ref.current.refresh('FORCE_PRESERVE_SELECTION');
      });
      expect(mockGetRequestList).toHaveBeenCalledTimes(2);
      expect(ref.current.getSelectedValue().selectCheckbox).toEqual([1]);
      expect(checkboxes[1]).toBeChecked();
    });
  });
});
