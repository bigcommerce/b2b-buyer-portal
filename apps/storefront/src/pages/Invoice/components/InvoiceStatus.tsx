import { B3Tag } from '@/components';

interface StatusProps {
  code: InvoiceStatusCode;
}

interface InvoiceStatusProps {
  [key: string]: {
    [key: string]: string;
  };
}

export enum InvoiceStatusCode {
  Open = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Overdue = 3,
}

export default function InvoiceStatus(props: StatusProps) {
  const { code } = props;

  const getInvoiceStatus = (code: number) => {
    const invoiceStatus: InvoiceStatusProps = {
      [InvoiceStatusCode.Open]: {
        textColor: '#000000',
        name: 'Open',
        color: '#F1C224',
      },
      [InvoiceStatusCode.PartiallyPaid]: {
        textColor: '#FFFFFF',
        name: 'Partially paid',
        color: '#516FAE',
      },
      [InvoiceStatusCode.Paid]: {
        textColor: '#000000',
        name: 'Paid',
        color: '#C4DD6C',
      },
      [InvoiceStatusCode.Overdue]: {
        textColor: '#FFFFFF',
        name: 'Overdue',
        color: '#D32F2F',
      },
    };

    const statusInfo = invoiceStatus[code] || {};

    return statusInfo;
  };

  const status = getInvoiceStatus(code);

  return status.name ? (
    <B3Tag color={status.color} textColor={status.textColor}>
      {status.name}
    </B3Tag>
  ) : null;
}
