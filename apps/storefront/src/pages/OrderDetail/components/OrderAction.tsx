import { Fragment, ReactNode, useCallback, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import throttle from 'lodash-es/throttle';

import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';
import HierarchyDialog from '@/pages/CompanyHierarchy/components/HierarchyDialog';
import { GlobalContext } from '@/shared/global';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { Address, MoneyFormat, OrderProductItem } from '@/types';
import { verifyLevelPermission } from '@/utils/b3CheckPermissions/check';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';
import { currencyFormat, ordersCurrencyFormat } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';
import { b2bPrintInvoice } from '@/utils/b3PrintInvoice';
import { snackbar } from '@/utils/b3Tip';

import { OrderDetailsContext, OrderDetailsState } from '../context/OrderDetailsContext';

import OrderDialog from './OrderDialog';

const OrderActionContainer = styled('div')(() => ({}));

interface StyledCardActionsProps {
  isShowButtons: boolean;
}

const StyledCardActions = styled('div')<StyledCardActionsProps>((props) => ({
  flexWrap: 'wrap',
  padding: props.isShowButtons ? '0 1rem 1rem 1rem' : 0,

  '& button': {
    marginLeft: '0',
    marginRight: '8px',
    margin: '8px 8px 0 0',
  },
}));

interface ItemContainerProps {
  nameKey: string;
}

const ItemContainer = styled('div')((props: ItemContainerProps) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: props.nameKey === 'grandTotal' ? 700 : 400,

  '& p': {
    marginTop: 0,
    marginBottom: props.nameKey === 'grandTotal' ? '0' : '12px',
    lineHeight: 1,
  },
}));

const PaymentItemContainer = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 400,
}));

interface Infos {
  info: {
    [k: string]: string;
  };
  money?: MoneyFormat;
  symbol?: {
    [k: string]: string;
  };
}

interface Buttons {
  value: string;
  key: string;
  name: string;
  variant?: 'text' | 'contained' | 'outlined';
  isCanShow: boolean;
}

interface OrderCardProps {
  header: string;
  subtitle: string;
  buttons: Buttons[];
  infos: Infos | string;
  products: OrderProductItem[];
  itemKey: string;
  orderId: string;
  role: number | string;
  ipStatus: number;
  invoiceId?: number | string | undefined | null;
  isCurrentCompany: boolean;
  switchCompanyId: number | string | undefined;
}

interface DialogData {
  dialogTitle: string;
  type: string;
  description: string;
  confirmText: string;
}

function OrderCard(props: OrderCardProps) {
  const {
    header,
    subtitle,
    buttons,
    infos,
    products,
    itemKey,
    orderId,
    role,
    invoiceId,
    ipStatus,
    isCurrentCompany,
    switchCompanyId,
  } = props;
  const displayAsNegativeNumber = ['coupon', 'discountAmount'];
  const b3Lang = useB3Lang();

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const dialogData = [
    {
      dialogTitle: b3Lang('orderDetail.orderCard.reorder'),
      type: 'reOrder',
      description: b3Lang('orderDetail.orderCard.reorderDescription'),
      confirmText: b3Lang('orderDetail.orderCard.reorderConfirmText'),
    },
    {
      dialogTitle: b3Lang('orderDetail.orderCard.return'),
      type: 'return',
      description: b3Lang('orderDetail.orderCard.returnDescription'),
      confirmText: b3Lang('orderDetail.orderCard.returnConfirmText'),
    },
    {
      dialogTitle: b3Lang('orderDetail.orderCard.addToShoppingList'),
      type: 'shoppingList',
      description: b3Lang('orderDetail.orderCard.addToShoppingListDescription'),
      confirmText: b3Lang('orderDetail.orderCard.addToShoppingListConfirmText'),
    },
  ];

  const navigate = useNavigate();

  const [openSwitchCompany, setOpenSwitchCompany] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [currentDialogData, setCurrentDialogData] = useState<DialogData>();
  const isShowButtons = buttons.filter((btn) => btn.isCanShow).length > 0;

  let infoKey: string[] = [];
  let infoValue: string[] = [];
  if (typeof infos !== 'string') {
    const { info } = infos;

    infoKey = Object.keys(info);
    infoValue = Object.values(info);
  }

  const handleShowSwitchCompanyModal = () => {
    if (!isCurrentCompany && switchCompanyId) {
      setOpenSwitchCompany(true);

      return true;
    }

    return false;
  };

  const handleOpenDialog = (name: string) => {
    if (name === 'viewInvoice') {
      if (ipStatus !== 0) {
        navigate(`/invoice?invoiceId=${invoiceId}`);
      } else {
        b2bPrintInvoice(orderId, 'b2b_print_invoice');
      }
    } else if (name === 'printInvoice') {
      window.open(`/account.php?action=print_invoice&order_id=${orderId}`);
    } else {
      const isNeedSwitch = handleShowSwitchCompanyModal();
      if (isNeedSwitch) return;
      if (!isAgenting && Number(role) === 3) {
        snackbar.error(b3Lang('orderDetail.orderCard.errorMasquerade'));
        return;
      }
      setOpen(true);
      setType(name);

      const newDialogData = dialogData.find((data: DialogData) => data.type === name);
      setCurrentDialogData(newDialogData);
    }
  };

  let showedInformation: ReactNode[] | string = infoValue?.map((value: string) => (
    <PaymentItemContainer key={value}>{value}</PaymentItemContainer>
  ));

  if (typeof infos === 'string') {
    showedInformation = infos;
  } else if (infos?.money) {
    const symbol = infos?.symbol || {};
    showedInformation = infoKey?.map((key: string, index: number) => (
      <Fragment key={key}>
        {symbol[key] === 'grandTotal' && (
          <Divider
            sx={{
              marginBottom: '1rem',
              marginTop: '0.5rem',
            }}
          />
        )}

        <ItemContainer key={key} nameKey={symbol[key]} aria-label={key} role="group">
          <p id="item-name-key">{key}</p>{' '}
          {displayAsNegativeNumber.includes(symbol[key]) ? (
            <p>
              {infos?.money
                ? `-${ordersCurrencyFormat(infos.money, infoValue[index])}`
                : `-${currencyFormat(infoValue[index])}`}
            </p>
          ) : (
            <p>
              {infos?.money
                ? ordersCurrencyFormat(infos.money, infoValue[index])
                : currencyFormat(infoValue[index])}
            </p>
          )}
        </ItemContainer>
      </Fragment>
    ));
  }

  return (
    <Card
      sx={{
        marginBottom: '1rem',
      }}
    >
      <Box
        sx={{
          padding: '1rem 1rem 0 1rem',
        }}
      >
        <Typography variant="h5">{header}</Typography>
        {subtitle && <div>{subtitle}</div>}
      </Box>
      <CardContent>
        <Box
          sx={{
            '& #item-name-key': {
              maxWidth: '70%',
              wordBreak: 'break-word',
            },
          }}
        >
          {showedInformation}
        </Box>
      </CardContent>
      <StyledCardActions isShowButtons={isShowButtons}>
        {buttons &&
          buttons.map((button: Buttons) => (
            <Fragment key={button.key}>
              {button.isCanShow && (
                <CustomButton
                  value={button.value}
                  key={button.key}
                  name={button.name}
                  variant={button.variant}
                  onClick={throttle(() => {
                    handleOpenDialog(button.name);
                  }, 2000)}
                >
                  {button.value}
                </CustomButton>
              )}
            </Fragment>
          ))}
      </StyledCardActions>

      <OrderDialog
        open={open}
        products={products}
        currentDialogData={currentDialogData}
        type={type}
        setOpen={setOpen}
        itemKey={itemKey}
        orderId={Number(orderId)}
      />

      <HierarchyDialog
        open={openSwitchCompany}
        currentRow={{
          companyId: Number(switchCompanyId || 0),
        }}
        handleClose={() => setOpenSwitchCompany(false)}
        // loading
        title={b3Lang('orderDetail.switchCompany.title')}
        context={b3Lang('orderDetail.switchCompany.content.tipsText')}
        dialogParams={{
          rightSizeBtn: b3Lang('global.B2BSwitchCompanyModal.confirm.button'),
        }}
      />
    </Card>
  );
}

interface OrderActionProps {
  detailsData: OrderDetailsState;
  isCurrentCompany: boolean;
}

interface OrderData {
  header: string;
  key: string;
  subtitle: string;
  buttons: Buttons[];
  infos: Infos | string;
}

export function OrderAction(props: OrderActionProps) {
  const { detailsData, isCurrentCompany } = props;
  const b3Lang = useB3Lang();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const emailAddress = useAppSelector(({ company }) => company.customer.emailAddress);
  const role = useAppSelector(({ company }) => company.customer.role);
  const b2bPermissions = useAppSelector(rolePermissionSelector);
  const {
    state: { shoppingListEnabled = false },
  } = useContext(GlobalContext);

  const {
    state: { addressLabelPermission, createdEmail },
  } = useContext(OrderDetailsContext);

  const {
    money,
    orderSummary: { createAt, name, priceData, priceSymbol } = {},
    payment: { billingAddress, paymentMethod, dateCreateAt } = {},
    orderComments = '',
    products,
    orderId,
    ipStatus = 0,
    invoiceId,
    poNumber,
    customerId,
    companyInfo: { companyId } = {},
  } = detailsData;

  const getPaymentMessage = useCallback(() => {
    let message = '';

    if (!createAt) return message;

    if (poNumber) {
      message = b3Lang('orderDetail.paidWithPo', {
        paidDate: displayFormat(createAt, true),
      });
    } else {
      message = b3Lang('orderDetail.paidInFull', {
        paidDate: displayFormat(createAt, true),
      });
    }
    return message;
  }, [poNumber, createAt, b3Lang]);

  if (!orderId) {
    return null;
  }

  const { purchasabilityPermission, shoppingListCreateActionsPermission } = b2bPermissions;
  const { getInvoicesPermission } = b2bPermissionsMap;
  const invoiceViewPermission = verifyLevelPermission({
    code: getInvoicesPermission,
    companyId: companyId ? Number(companyId) : 0,
    userId: customerId ? Number(customerId) : 0,
  });

  const getCompanyName = (company: string) => {
    if (addressLabelPermission) {
      return company;
    }

    const index = company.indexOf('/');

    return company.substring(index + 1, company.length);
  };

  const getFullPaymentAddress = (billingAddress?: Address) => {
    if (!billingAddress) {
      return {};
    }
    const {
      first_name: firstName,
      last_name: lastName,
      company,
      street_1: street1,
      state,
      zip,
      country,
      city,
    } = billingAddress || {};
    const paymentAddress = {
      paymentMethod: b3Lang('orderDetail.paymentMethod', { paymentMethod: paymentMethod ?? '' }),
      name: b3Lang('orderDetail.customerName', { firstName, lastName }),
      company: getCompanyName(company),
      street: street1,
      address: b3Lang('orderDetail.customerAddress', {
        city,
        state,
        zip,
        country,
      }),
    };

    return paymentAddress;
  };

  const handleOrderComments = (value: string) => {
    const commentsArr = value.split(/\n/g);

    const comments: {
      [k: string]: string;
    } = {};

    const dividingLine = ['-------------------------------------'];

    commentsArr.forEach((item, index) => {
      if (item.trim().length > 0) {
        const isHaveTitle = item.trim().includes(':');

        let message = isHaveTitle ? item : b3Lang('orderDetail.itemComments', { item });
        if (dividingLine.includes(item)) {
          message = item;
        }

        comments[`mes${index}`] = message;
      }
    });

    return comments;
  };

  const buttons: Buttons[] = [
    {
      value: b3Lang('orderDetail.reorder'),
      key: 'Re-Order',
      name: 'reOrder',
      variant: 'outlined',
      isCanShow: isB2BUser ? purchasabilityPermission : true,
    },
    {
      value: b3Lang('orderDetail.return'),
      key: 'Return',
      name: 'return',
      variant: 'outlined',
      // isCanShow should be the value of canReturn, obtained from detailsData, but in ticket BUN-1417 was
      // decided to hide it until the return function works as expected.
      // After that it should returned to its original value.
      isCanShow: false,
    },
    {
      value: b3Lang('orderDetail.addToShoppingList'),
      key: 'add-to-shopping-list',
      name: 'shoppingList',
      variant: 'outlined',
      isCanShow: isB2BUser
        ? shoppingListCreateActionsPermission && shoppingListEnabled
        : shoppingListEnabled,
    },
  ];

  const invoiceBtnPermissions = Number(ipStatus) !== 0 || createdEmail === emailAddress;
  const orderData: OrderData[] = [
    {
      header: b3Lang('orderDetail.summary'),
      key: 'order-summary',
      subtitle:
        dateCreateAt && name
          ? b3Lang('orderDetail.purchaseDetails', {
              name,
              updatedAt: displayFormat(Number(dateCreateAt)),
            })
          : '',
      buttons,
      infos: {
        money,
        info: priceData || {},
        symbol: priceSymbol || {},
      },
    },
    {
      header: b3Lang('orderDetail.payment'),
      key: 'payment',
      subtitle: getPaymentMessage(),
      buttons: [
        {
          value: isB2BUser ? b3Lang('orderDetail.viewInvoice') : b3Lang('orderDetail.printInvoice'),
          key: 'aboutInvoice',
          name: isB2BUser ? 'viewInvoice' : 'printInvoice',
          variant: 'outlined',
          isCanShow: isB2BUser
            ? invoiceBtnPermissions && invoiceViewPermission
            : invoiceBtnPermissions,
        },
      ],
      infos: {
        info: getFullPaymentAddress(billingAddress),
      },
    },
    {
      header: b3Lang('orderDetail.comments'),
      key: 'order-comments',
      subtitle: '',
      buttons: [],
      infos: {
        info: handleOrderComments(orderComments),
      },
    },
  ];

  return (
    <OrderActionContainer>
      {orderData &&
        orderData.map((item: OrderData) => (
          <OrderCard
            products={products!}
            orderId={orderId.toString()}
            {...item}
            itemKey={item.key}
            role={role}
            ipStatus={ipStatus}
            invoiceId={invoiceId}
            key={item.key}
            isCurrentCompany={isCurrentCompany}
            switchCompanyId={companyId}
          />
        ))}
    </OrderActionContainer>
  );
}
