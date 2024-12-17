import { useContext, useMemo, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Business as BusinessIcon, MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { Box, Card, Chip, IconButton, Menu, MenuItem } from '@mui/material';

import { CustomStyleContext } from '@/shared/customStyleButton';

import { RecursiveNode, TreeNodeProps } from './types';

interface CompanyTableRowCardProps<T extends TreeNodeProps> {
  company: RecursiveNode<T>;
  currentCompanyId?: string | number;
  selectCompanyId?: string | number;
  onSwitchCompany?: (node: T) => void;
  getDisplayName?: (node: T) => string;
  getNodeId?: (node: T) => string | number;
}

function CompanyTableRowCard<T extends TreeNodeProps>({
  company,
  currentCompanyId = '',
  selectCompanyId = '',
  onSwitchCompany,
  getDisplayName = (node) => node.companyName,
  getNodeId = (node) => node.companyId,
}: CompanyTableRowCardProps<T>) {
  const nodeId = getNodeId(company);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const b3Lang = useB3Lang();
  const {
    state: {
      switchAccountButton: { color = '#ED6C02' },
    },
  } = useContext(CustomStyleContext);
  const isCurrentCompanyId = +nodeId === +currentCompanyId;
  const isSelectCompanyId = +nodeId === +selectCompanyId;

  const open = Boolean(anchorEl);
  const isDisabledAction = useMemo(() => {
    if (selectCompanyId) {
      return +selectCompanyId !== +company.companyId;
    }

    return +currentCompanyId !== +company.companyId;
  }, [currentCompanyId, selectCompanyId, company]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchClick = () => {
    handleClose();
    onSwitchCompany?.(company);
  };

  const openIcon = open
    ? {
        borderRadius: '10%',
        backgroundColor: 'rgba(0, 0, 0, 0.14)',
      }
    : {};

  return (
    <Card
      sx={{
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <BusinessIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1 }} />
            {getDisplayName(company)}
          </Box>
          {company?.channelFlag && isDisabledAction && (
            <IconButton
              size="small"
              onClick={handleClick}
              aria-controls={open ? 'company-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              sx={{
                pt: 0,

                '& svg': {
                  ...openIcon,
                },
              }}
            >
              <MoreHorizIcon />
            </IconButton>
          )}
        </Box>
        {isSelectCompanyId && (
          <Chip
            label={b3Lang('companyHierarchy.chip.selectCompany')}
            size="small"
            sx={{
              mt: 2,
              backgroundColor: color,
              color: 'white',
              height: 24,
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        )}
        {isCurrentCompanyId && (
          <Chip
            label={b3Lang('companyHierarchy.chip.currentCompany')}
            size="small"
            sx={{
              mt: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              height: 24,
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        )}
      </Box>
      <Menu
        id="company-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'company-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          sx={{
            color: 'primary.main',
          }}
          onClick={handleSwitchClick}
        >
          {b3Lang('companyHierarchy.dialog.title')}
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default CompanyTableRowCard;
