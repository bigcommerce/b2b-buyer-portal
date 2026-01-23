import { useContext, useMemo, useState } from 'react';
import {
  Business as BusinessIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';

import CompanyTableRowCard from './CompanyTableRowCard';
import { RecursiveNode, TreeNodeProps } from './types';

interface CompanyTableProps<T extends TreeNodeProps> {
  data: Array<RecursiveNode<T>>;
  currentCompanyId?: string | number;
  selectCompanyId?: string | number;
  onSwitchCompany?: (node: T) => void;
  getDisplayName?: (node: T) => string;
  getNodeId?: (node: T) => string | number;
}

interface CompanyTableRowProps<T extends TreeNodeProps> {
  node: RecursiveNode<T>;
  level?: number;
  currentCompanyId?: string | number;
  selectCompanyId?: string | number;
  onSwitchCompany?: (node: T) => void;
  getDisplayName?: (node: T) => string;
  getNodeId?: (node: T) => string | number;
}

function CompanyTableRow<T extends TreeNodeProps>({
  node,
  level = 0,
  currentCompanyId = '',
  selectCompanyId = '',
  onSwitchCompany,
  getDisplayName = (node) => node.companyName,
  getNodeId = (node) => node.companyId,
}: CompanyTableRowProps<T>) {
  const [expanded, setExpanded] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const b3Lang = useB3Lang();

  const {
    state: {
      switchAccountButton: { color = '#ED6C02' },
    },
  } = useContext(CustomStyleContext);

  const hasChildren = node.children && node.children.length > 0;
  const nodeId = getNodeId(node);
  const isCurrentCompanyId = Number(nodeId) === Number(currentCompanyId);

  const isSelectCompanyId = Number(nodeId) === Number(selectCompanyId);
  const open = Boolean(anchorEl);

  const isDisabledAction = useMemo(() => {
    if (selectCompanyId) {
      return Number(selectCompanyId) !== Number(node.companyId);
    }

    return Number(currentCompanyId) !== Number(node.companyId);
  }, [currentCompanyId, selectCompanyId, node]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchClick = () => {
    handleClose();
    onSwitchCompany?.(node);
  };

  return (
    <>
      <TableRow
        sx={{
          '&:last-child td, &:last-child th': { border: 0 },
          '& > td': { bgcolor: 'background.paper' },
          height: '3.25rem',
        }}
      >
        <TableCell sx={{ width: '100%', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', ml: level * 4, alignItems: 'center' }}>
              {hasChildren ? (
                <IconButton
                  data-testid={expanded ? 'collapse' : 'open'}
                  onClick={() => setExpanded(!expanded)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <KeyboardArrowDownIcon
                    sx={{
                      transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s',
                      color: 'rgba(0, 0, 0, 0.54)',
                    }}
                  />
                </IconButton>
              ) : (
                <Box sx={{ width: 40 }} />
              )}
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
              </Box>
              <Box component="span" sx={{ mr: 1 }}>
                {getDisplayName(node)}
              </Box>
              {isSelectCompanyId && (
                <Chip
                  label={b3Lang('companyHierarchy.chip.selectCompany')}
                  size="small"
                  sx={{
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
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ width: 48, py: 1 }}>
          {node.channelFlag && isDisabledAction && (
            <IconButton
              aria-controls={open ? 'company-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              data-testid="actions"
              onClick={handleClick}
              size="small"
            >
              <MoreHorizIcon />
            </IconButton>
          )}
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
        </TableCell>
      </TableRow>
      {expanded &&
        hasChildren &&
        (node.children || []).map((child) => (
          <CompanyTableRow
            currentCompanyId={currentCompanyId}
            getDisplayName={getDisplayName}
            getNodeId={getNodeId}
            key={getNodeId(child)}
            level={level + 1}
            node={child}
            onSwitchCompany={onSwitchCompany}
            selectCompanyId={selectCompanyId}
          />
        ))}
    </>
  );
}

function CompanyHierarchyTableTree<T extends TreeNodeProps>({
  data,
  currentCompanyId,
  selectCompanyId,
  onSwitchCompany,
  getDisplayName = (node) => node.companyName,
  getNodeId = (node) => node.companyId,
}: CompanyTableProps<T>) {
  const [isMobile] = useMobile();
  const b3Lang = useB3Lang();

  const handleExpandCompanyData = (
    companies: Array<RecursiveNode<T>> | [],
    companyData: Array<RecursiveNode<T>>,
  ) => {
    if (companies.length === 0) {
      return companyData;
    }

    companies.forEach((company) => {
      companyData.push({
        ...company,
        children: [],
      });

      const isHasChildren = company.children && company.children.length > 0;

      if (isHasChildren) {
        handleExpandCompanyData(company.children || [], companyData);
      }
    });

    return companyData;
  };
  const mobileCompanyData = handleExpandCompanyData(data, []);

  return (
    <>
      {isMobile ? (
        <div role="list">
          {mobileCompanyData.map((company) => (
            <CompanyTableRowCard
              company={company}
              currentCompanyId={currentCompanyId}
              getDisplayName={getDisplayName}
              getNodeId={getNodeId}
              key={getNodeId(company)}
              onSwitchCompany={onSwitchCompany}
              selectCompanyId={selectCompanyId}
            />
          ))}
        </div>
      ) : (
        <Paper sx={{ width: '100%', minHeight: '100px', mx: 'auto', mt: 2 }}>
          <TableContainer>
            <Table aria-label="company structure table" size="small">
              <TableHead>
                <TableRow sx={{ height: '3.25rem' }}>
                  <TableCell sx={{ fontWeight: 500, pl: 8 }}>
                    {b3Lang('companyHierarchy.table.name')}
                  </TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((company) => (
                  <CompanyTableRow
                    currentCompanyId={currentCompanyId}
                    getDisplayName={getDisplayName}
                    getNodeId={getNodeId}
                    key={getNodeId(company)}
                    node={company}
                    onSwitchCompany={onSwitchCompany}
                    selectCompanyId={selectCompanyId}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </>
  );
}

export default CompanyHierarchyTableTree;
