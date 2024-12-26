import { useState } from 'react';
import { Box } from '@mui/material';

import useMobile from '@/hooks/useMobile';

import CustomButton from '../button/CustomButton';
import { B3Select } from '../ui';

import B3FilterMore from './B3FilterMore';
import B3FilterSearch from './B3FilterSearch';

interface SortByItemNameProps {
  valueName: string;
  labelName: string;
}

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string | null;
  label: string;
  w?: number;
  pickerKey?: string;
}

interface SortByConfigProps {
  isEnabled: boolean;
  sortByList?: any[];
  sortByItemName?: SortByItemNameProps | undefined;
  sortByLabel: string;
  defaultValue?: string | undefined;
  isFirstSelect?: boolean;
  firstSelectText?: string;
  w?: number;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

interface CustomButtonProps {
  isEnabled: boolean;
  customLabel: string;
  customButtonStyle?: { [key: string]: string };
}

interface B3FilterProps<T, Y> {
  sortByConfig?: SortByConfigProps;
  customButtonConfig?: CustomButtonProps;
  startPicker?: PickerProps;
  endPicker?: PickerProps;
  filterMoreInfo: Array<DeepPartial<T>>;
  handleChange: (key: string, value: string) => void;
  handleFilterChange: (value: Y) => void;
  handleFilterCustomButtonClick?: () => void;
  showB3FilterMoreIcon?: boolean;
  searchValue?: string;
  resetFilterInfo?: () => void;
}

function B3Filter<T, Y>(props: B3FilterProps<T, Y>) {
  const {
    sortByConfig,
    startPicker,
    endPicker,
    filterMoreInfo,
    customButtonConfig,
    handleChange,
    handleFilterChange,
    handleFilterCustomButtonClick,
    showB3FilterMoreIcon = true,
    searchValue = '',
    resetFilterInfo,
  } = props;

  const [isMobile] = useMobile();

  const [sortByValue, setSortBy] = useState<string>(sortByConfig?.defaultValue || '');

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    handleChange('sortBy', value);
  };

  const handleSearchChange = (value: string) => {
    handleChange('search', value);
  };

  const handleCustomBtnClick = () => {
    if (handleFilterCustomButtonClick) handleFilterCustomButtonClick();
  };

  return (
    <>
      {!isMobile && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: '30px',
          }}
        >
          <Box
            sx={{
              maxWidth: '29rem',
              flexBasis: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <B3FilterSearch handleChange={handleSearchChange} w="60%" searchValue={searchValue} />
            {showB3FilterMoreIcon && (
              <B3FilterMore
                startPicker={startPicker}
                endPicker={endPicker}
                filterMoreInfo={filterMoreInfo}
                onChange={handleFilterChange}
                resetFilterInfo={resetFilterInfo}
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {sortByConfig?.isEnabled && (
              <Box
                sx={{
                  ml: '5px',
                  mr: 0,
                }}
              >
                <B3Select
                  list={sortByConfig?.sortByList || []}
                  value={sortByValue}
                  handleChange={handleSortByChange}
                  label={sortByConfig?.sortByLabel || ''}
                  config={sortByConfig?.sortByItemName}
                  isFirstSelect={sortByConfig?.isFirstSelect}
                  firstSelectText={sortByConfig?.firstSelectText}
                  w={sortByConfig?.w || 150}
                />
              </Box>
            )}
            {customButtonConfig?.isEnabled && (
              <CustomButton
                size="small"
                variant="contained"
                sx={{
                  height: '42px',
                  p: '0 20px',
                  ...(customButtonConfig?.customButtonStyle || {}),
                }}
                onClick={handleCustomBtnClick}
              >
                {customButtonConfig?.customLabel || ''}
              </CustomButton>
            )}
            {/* <B3FilterToggleTable /> */}
          </Box>
        </Box>
      )}
      {isMobile && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            mb: '5vw',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <B3FilterSearch handleChange={handleSearchChange} w="90%" searchValue={searchValue} />
            <B3FilterMore
              startPicker={startPicker}
              endPicker={endPicker}
              filterMoreInfo={filterMoreInfo}
              onChange={handleFilterChange}
              resetFilterInfo={resetFilterInfo}
            />
          </Box>
          {customButtonConfig?.isEnabled && (
            <CustomButton
              size="small"
              variant="contained"
              fullWidth
              sx={{
                marginTop: '20px',
                height: '42px',
                ...(customButtonConfig?.customButtonStyle || {}),
              }}
              onClick={handleCustomBtnClick}
            >
              {customButtonConfig?.customLabel || ''}
            </CustomButton>
          )}
        </Box>
      )}
    </>
  );
}

export default B3Filter;
