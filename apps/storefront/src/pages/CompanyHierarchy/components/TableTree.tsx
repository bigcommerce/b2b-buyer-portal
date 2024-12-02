import { useState } from 'react';
import { useB3Lang } from '@b3/lang';
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

interface TreeNodeProps {
  companyId: string | number;
  companyName: string;
  channelFlag: boolean;
}

type RecursiveNode<T> = T & {
  childs?: RecursiveNode<T>[];
};

interface CompanyTableProps<T extends TreeNodeProps> {
  data: RecursiveNode<T>[];
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

  const hasChildren = node.childs && node.childs.length > 0;
  const nodeId = getNodeId(node);
  const isCurrentCompanyId = +nodeId === +currentCompanyId;

  const isSelectCompanyId = +nodeId === +selectCompanyId;
  const open = Boolean(anchorEl);

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
                <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ mr: 1 }}>
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
                    backgroundColor: '#ED6C02',
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
          {node?.channelFlag && (
            <IconButton
              size="small"
              onClick={handleClick}
              aria-controls={open ? 'company-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <MoreHorizIcon />
            </IconButton>
          )}
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
        </TableCell>
      </TableRow>
      {expanded &&
        hasChildren &&
        (node?.childs || []).map((child) => (
          <CompanyTableRow
            key={getNodeId(child)}
            node={child}
            level={level + 1}
            currentCompanyId={currentCompanyId}
            selectCompanyId={selectCompanyId}
            onSwitchCompany={onSwitchCompany}
            getDisplayName={getDisplayName}
            getNodeId={getNodeId}
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
  const b3Lang = useB3Lang();

  return (
    <Paper sx={{ width: '100%', minHeight: '100px', mx: 'auto', mt: 2 }}>
      <TableContainer>
        <Table size="small" aria-label="company structure table">
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
                key={getNodeId(company)}
                node={company}
                currentCompanyId={currentCompanyId}
                selectCompanyId={selectCompanyId}
                onSwitchCompany={onSwitchCompany}
                getDisplayName={getDisplayName}
                getNodeId={getNodeId}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default CompanyHierarchyTableTree;
