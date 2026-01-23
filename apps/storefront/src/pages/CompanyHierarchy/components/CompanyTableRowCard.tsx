import { useContext, useId, useMemo, useState } from 'react';
import { Business as BusinessIcon, MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { Box, Card, Chip, IconButton, Menu, MenuItem } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
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
  const companyNameId = useId();
  const nodeId = getNodeId(company);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const b3Lang = useB3Lang();
  const {
    state: {
      switchAccountButton: { color = '#ED6C02' },
    },
  } = useContext(CustomStyleContext);
  const isCurrentCompanyId = Number(nodeId) === Number(currentCompanyId);
  const isSelectCompanyId = Number(nodeId) === Number(selectCompanyId);

  const open = Boolean(anchorEl);
  const isDisabledAction = useMemo(() => {
    if (selectCompanyId) {
      return Number(selectCompanyId) !== Number(company.companyId);
    }

    return Number(currentCompanyId) !== Number(company.companyId);
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
      aria-labelledby={companyNameId}
      role="listitem"
      sx={{
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box id={companyNameId} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <BusinessIcon sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1 }} />
            {getDisplayName(company)}
          </Box>
          {company.channelFlag && isDisabledAction && (
            <IconButton
              aria-controls={open ? 'company-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              data-testid="actions"
              onClick={handleClick}
              size="small"
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
        MenuListProps={{
          'aria-labelledby': 'company-button',
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        id="company-menu"
        onClose={handleClose}
        open={open}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={handleSwitchClick}
          sx={{
            color: 'primary.main',
          }}
        >
          {b3Lang('companyHierarchy.dialog.title')}
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default CompanyTableRowCard;
