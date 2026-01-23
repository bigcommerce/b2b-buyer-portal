import { FilterList as FilterListIcon } from '@mui/icons-material';
import { BaseSyntheticEvent, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge, Box, Button, IconButton, useTheme } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';

import { B3CustomForm } from '../B3CustomForm';
import B3Dialog from '../B3Dialog';
import CustomButton from '../button/CustomButton';
import { getContrastColor, getHoverColor } from '../outSideComponents/utils/b3CustomStyles';

import B3FilterPicker from './B3FilterPicker';

const includesFilterType = ['roleAutocomplete'];

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string | null;
  label: string;
  pickerKey?: string;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : DeepPartial<T[P]>;
};

interface B3FilterMoreProps<T, Y> {
  startPicker?: PickerProps;
  endPicker?: PickerProps;
  filterMoreInfo: Array<DeepPartial<T>>;
  onChange?: (val: Y) => void;
  isShowMore?: boolean;
  resetFilterInfo?: () => void;
}

interface PickerRefProps extends HTMLInputElement {
  setClearPickerValue: () => void;
  getPickerValue: () => Record<string, string>;
}

function B3FilterMore<T, Y>({
  startPicker,
  endPicker,
  filterMoreInfo,
  onChange,
  isShowMore = false,
  resetFilterInfo,
}: B3FilterMoreProps<T, Y>) {
  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const [open, setOpen] = useState<boolean>(false);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [filterCounter, setFilterCounter] = useState<number>(0);

  const [cacheData, setCacheData] = useState<CustomFieldItems | null>(null);

  const pickerRef = useRef<PickerRefProps | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  });

  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  useEffect(() => {
    if (cacheData) {
      Object.keys(cacheData).forEach((item: string) => {
        setValue(item, cacheData[item]);
      });
    }
    // disabling because setValue is a dispatcher
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheData, open]);

  const handleDialogClick = () => {
    setOpen(true);
  };

  const filterCounterVal = useMemo(() => {
    if (!filterCounter) {
      return 0;
    }

    const values = getValues();

    const newCounter = filterMoreInfo.reduce((cur, item) => {
      const newItem: CustomFieldItems = item;

      if (includesFilterType.includes(newItem.fieldType) && values[newItem.name]) {
        cur -= 1;
      }

      return cur;
    }, filterCounter);

    return newCounter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCounter]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleFilterStatus = (submitData?: any) => {
    if (submitData) {
      const filterCountArr = [];
      const isNotFiltering = Object.keys(submitData).every((item) => submitData[item] === '');

      Object.keys(submitData).forEach((item) => {
        if (submitData[item] !== '') {
          filterCountArr.push(item);
        }
      });

      setIsFiltering(!isNotFiltering);
      setFilterCounter(filterCountArr.length);
    }
  };

  const handleSaveFilters = (event: BaseSyntheticEvent | undefined) => {
    handleSubmit((data) => {
      const getPickerValues = pickerRef.current?.getPickerValue();

      if (onChange) {
        const submitData: any = {
          ...getPickerValues,
          ...data,
        };

        handleFilterStatus(submitData);
        onChange(submitData);

        setCacheData({
          ...data,
        });
      }

      handleClose();
    })(event);
  };

  const handleClearFilters = () => {
    Object.keys(getValues()).forEach((item: string) => {
      setValue(item, '');
    });

    if (resetFilterInfo) {
      resetFilterInfo();
    }

    pickerRef.current?.setClearPickerValue();
  };

  const handleClearBtn = () => {
    const pickerValues = startPicker?.isEnabled
      ? {
          startValue: '',
          endValue: '',
        }
      : {};

    handleClearFilters();

    const data = getValues();

    if (onChange) {
      const submitData: any = {
        ...pickerValues,
        ...data,
      };

      handleFilterStatus(submitData);
      onChange(submitData);

      setCacheData({
        ...data,
      });
    }
  };

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
      }}
    >
      {((filterMoreInfo && filterMoreInfo.length) || isShowMore) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box onClick={handleDialogClick}>
            {!isFiltering && (
              <IconButton
                aria-label="edit"
                size="medium"
                sx={{
                  color: customColor,
                  ':hover': {
                    backgroundColor: getHoverColor('#FFFFFF', 0.1),
                  },
                  '& svg': {
                    width: '32px',
                    height: '32px',
                  },
                }}
              >
                <FilterListIcon />
              </IconButton>
            )}
            {isFiltering && (
              <IconButton
                aria-label="edit"
                size="medium"
                sx={{
                  color: customColor,
                  ':hover': {
                    backgroundColor: getHoverColor('#FFFFFF', 0.1),
                  },
                }}
              >
                <Badge
                  badgeContent={filterCounterVal}
                  sx={{
                    '& .MuiBadge-badge.MuiBadge-standard.MuiBadge-anchorOriginTopRight': {
                      bgcolor: primaryColor,
                      borderRadius: '50%',
                    },
                  }}
                >
                  <FilterListIcon />
                </Badge>
              </IconButton>
            )}
          </Box>
          {isFiltering && !isMobile && (
            <Button
              aria-label="clear-edit"
              onClick={handleClearBtn}
              size="small"
              sx={{
                marginLeft: '5px',
                color: '#1976D2',
              }}
            >
              {b3Lang('global.filter.clearFilters')}
            </Button>
          )}
        </Box>
      )}

      <B3Dialog
        handRightClick={handleSaveFilters}
        handleLeftClick={handleClose}
        isOpen={open}
        leftSizeBtn={b3Lang('global.filter.cancel')}
        rightSizeBtn={b3Lang('global.filter.apply')}
        title={b3Lang('global.filter.title')}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : '450px',
          }}
        >
          <B3CustomForm
            control={control}
            errors={errors}
            formFields={filterMoreInfo}
            getValues={getValues}
            setValue={setValue}
          />
          <B3FilterPicker endPicker={endPicker} ref={pickerRef} startPicker={startPicker} />
        </Box>
        <CustomButton
          onClick={handleClearFilters}
          size="small"
          sx={{
            mt: 1,
          }}
        >
          {b3Lang('global.filter.clearFilters')}
        </CustomButton>
      </B3Dialog>
    </Box>
  );
}

export default B3FilterMore;
