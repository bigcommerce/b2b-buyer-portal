import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useB3Lang } from '@/lib/lang';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { InvoiceList } from '@/types/invoice';
import { b2bPermissionsMap, snackbar, verifyLevelPermission } from '@/utils';

import { gotoInvoiceCheckoutUrl } from '../utils/payment';
import { getInvoiceDownloadPDFUrl, handlePrintPDF } from '../utils/pdf';

import { triggerPdfDownload } from './triggerPdfDownload';

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
  isCurrentCompany: boolean;
  invoicePay: boolean;
}

function B3Pulldown({
  row,
  setIsRequestLoading,
  setInvoiceId,
  handleOpenHistoryModal,
  isCurrentCompany,
  invoicePay,
}: B3PulldownProps) {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPay, setIsPay] = useState<boolean>(true);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  const { invoicePayPermission, purchasabilityPermission } = useAppSelector(rolePermissionSelector);
  const { getOrderPermission: getOrderPermissionCode } = b2bPermissionsMap;

  const [isCanViewOrder, setIsCanViewOrder] = useState<boolean>(false);

  const close = () => {
    setIsOpen(false);
  };

  const handleMoreActionsClick = () => {
    const { id } = row;
    setInvoiceId(id);
    setIsOpen(true);
  };

  const handleViewInvoice = async (isPayNow: boolean) => {
    const { id } = row;

    close();

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
    close();
    navigate(`/orderDetail/${orderNumber}`);
  };

  const handlePay = async () => {
    close();

    const { openBalance, originalBalance, id } = row;

    const params = {
      lineItems: [
        {
          invoiceId: Number(id),
          amount: openBalance.value === '.' ? '0' : `${Number(openBalance.value)}`,
        },
      ],
      currency: openBalance?.code || originalBalance.code,
    };

    if (openBalance.value === '.' || Number(openBalance.value) === 0) {
      snackbar.error('The payment amount entered has an invalid value.');

      return;
    }

    await gotoInvoiceCheckoutUrl(params, platform, false);
  };

  const viewPaymentHistory = async () => {
    close();
    handleOpenHistoryModal(true);
  };

  const handleDownloadPDF = async () => {
    const { id } = row;

    close();
    setIsRequestLoading(true);
    const url = await getInvoiceDownloadPDFUrl(id);

    setIsRequestLoading(false);

    triggerPdfDownload(url, 'file.pdf');
  };

  useEffect(() => {
    const { openBalance, orderUserId, companyInfo } = row;
    const payPermissions =
      Number(openBalance.value) > 0 && invoicePayPermission && purchasabilityPermission;

    const isPayInvoice = isCurrentCompany ? payPermissions : payPermissions && invoicePay;
    setIsPay(isPayInvoice);

    const viewOrderPermission = verifyLevelPermission({
      code: getOrderPermissionCode,
      companyId: Number(companyInfo.companyId),
      userId: Number(orderUserId),
    });

    setIsCanViewOrder(viewOrderPermission);
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <IconButton
        onClick={handleMoreActionsClick}
        ref={ref}
        aria-label={b3Lang('invoice.actions.moreActions')}
        aria-haspopup="menu"
      >
        <MoreHorizIcon />
      </IconButton>
      <StyledMenu
        id="basic-menu"
        anchorEl={ref.current}
        open={isOpen}
        onClose={close}
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
          onClick={() =>
            handleViewInvoice(row.status !== 2 && invoicePayPermission && purchasabilityPermission)
          }
        >
          {b3Lang('invoice.actions.viewInvoice')}
        </MenuItem>
        {isCanViewOrder && (
          <MenuItem
            key="View-Order"
            sx={{
              color: 'primary.main',
            }}
            onClick={handleViewOrder}
          >
            {b3Lang('invoice.actions.viewOrder')}
          </MenuItem>
        )}

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
        {isPay && (
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
          onClick={() =>
            handleViewInvoice(row.status !== 2 && invoicePayPermission && purchasabilityPermission)
          }
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
