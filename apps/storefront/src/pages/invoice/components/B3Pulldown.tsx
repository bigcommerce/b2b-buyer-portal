import { MouseEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useAppSelector } from '@/store';
import { InvoiceList } from '@/types/invoice';
import { snackbar } from '@/utils';

import { gotoInvoiceCheckoutUrl } from '../utils/payment';
import { getInvoiceDownloadPDFUrl, handlePrintPDF } from '../utils/pdf';

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-elevation': {
    boxShadow:
      '0px 1px 0px -1px rgba(0, 0, 0, 0.1), 0px 1px 6px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
  },
}));

interface B3PulldownProps {
  row: InvoiceList;
  setIsRequestLoading: (bool: boolean) => void;
  setInvoiceId: (id: string) => void;
  handleOpenHistoryModal: (bool: boolean) => void;
}

function B3Pulldown({
  row,
  setIsRequestLoading,
  setInvoiceId,
  handleOpenHistoryModal,
}: B3PulldownProps) {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const role = useAppSelector(({ company }) => company.customer.role);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const juniorOrSenior = +role === 1 || role === 2;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isCanPay, setIsCanPay] = useState<boolean>(true);

  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  const b3Lang = useB3Lang();

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMoreActionsClick = (event: MouseEvent<HTMLButtonElement>) => {
    const { id } = row;
    setInvoiceId(id);
    setAnchorEl(event.currentTarget);
  };

  const handleViewInvoice = async (isPayNow: boolean) => {
    const { id } = row;

    setAnchorEl(null);

    setIsRequestLoading(true);

    const pdfUrl = await handlePrintPDF(id, isPayNow);

    setIsRequestLoading(false);

    if (!pdfUrl) {
      snackbar.error('pdf url resolution error');
      return;
    }

    const { href } = window.location;
    if (!href.includes('invoice')) {
      return;
    }

    window.open(pdfUrl, '_blank', 'fullscreen=yes');
  };

  const handleViewOrder = () => {
    const { orderNumber } = row;
    setAnchorEl(null);
    navigate(`/orderDetail/${orderNumber}`);
  };

  const handlePay = async () => {
    setAnchorEl(null);

    const { openBalance, originalBalance, id } = row;

    const params = {
      lineItems: [
        {
          invoiceId: +id,
          amount: openBalance.value === '.' ? '0' : `${+openBalance.value}`,
        },
      ],
      currency: openBalance?.code || originalBalance.code,
    };

    if (openBalance.value === '.' || +openBalance.value === 0) {
      snackbar.error('The payment amount entered has an invalid value.', {
        isClose: true,
      });

      return;
    }

    await gotoInvoiceCheckoutUrl(params, platform, false);
  };

  const viewPaymentHistory = async () => {
    setAnchorEl(null);
    handleOpenHistoryModal(true);
  };

  const handleDownloadPDF = async () => {
    const { id } = row;

    setAnchorEl(null);
    setIsRequestLoading(true);
    const url = await getInvoiceDownloadPDFUrl(id);

    setIsRequestLoading(false);

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = 'file.pdf';
    a.click();
  };

  useEffect(() => {
    const { openBalance } = row;
    const payPermissions = +openBalance.value > 0 && (role === 0 || isAgenting);

    setIsCanPay(payPermissions);
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <IconButton onClick={(e) => handleMoreActionsClick(e)}>
        <MoreHorizIcon />
      </IconButton>
      <StyledMenu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
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
          key="View-invoice"
          sx={{
            color: 'primary.main',
          }}
          onClick={() => handleViewInvoice(row.status !== 2 && !juniorOrSenior)}
        >
          {b3Lang('invoice.actions.viewInvoice')}
        </MenuItem>
        <MenuItem
          key="View-Order"
          sx={{
            color: 'primary.main',
          }}
          onClick={handleViewOrder}
        >
          {b3Lang('invoice.actions.viewOrder')}
        </MenuItem>
        {row.status !== 0 && (
          <MenuItem
            key="View-payment-history"
            sx={{
              color: 'primary.main',
            }}
            onClick={viewPaymentHistory}
          >
            {b3Lang('invoice.actions.viewPaymentHistory')}
          </MenuItem>
        )}
        {isCanPay && (
          <MenuItem
            key="Pay"
            sx={{
              color: 'primary.main',
            }}
            onClick={handlePay}
          >
            {b3Lang('invoice.actions.pay')}
          </MenuItem>
        )}
        <MenuItem
          key="Print"
          sx={{
            color: 'primary.main',
          }}
          onClick={() => handleViewInvoice(row.status !== 2 && !juniorOrSenior)}
        >
          {b3Lang('invoice.actions.print')}
        </MenuItem>
        <MenuItem
          key="Download"
          sx={{
            color: 'primary.main',
          }}
          onClick={() => handleDownloadPDF()}
        >
          {b3Lang('invoice.actions.download')}
        </MenuItem>
      </StyledMenu>
    </>
  );
}

export default B3Pulldown;
