import { B3Tag } from '@/components';
import { LangFormatFunction, useB3Lang } from '@/lib/lang';

interface OrderStatusProps {
  code: string;
}

interface QuoteStatusObj {
  [x: string]: {
    textColor: string;
    idLang: string;
    color: string;
  };
}

const quoteStatus: QuoteStatusObj = {
  '0': {
    textColor: 'rgba(0, 0, 0, 0.87)',
    idLang: 'global.quoteStatusCode.draft',
    color: '#D8D6D1',
  },
  '1': {
    textColor: 'rgba(0, 0, 0, 0.87)',
    idLang: 'global.quoteStatusCode.open',
    color: '#F1C224',
  },
  '4': {
    textColor: 'rgba(0, 0, 0, 0.87)',
    idLang: 'global.quoteStatusCode.ordered',
    color: '#C4DD6C',
  },
  '5': {
    textColor: '#fff',
    idLang: 'global.quoteStatusCode.expired',
    color: '#BD3E1E',
  },
};

const getOrderStatus = (code: string, b3Lang: LangFormatFunction) => {
  const status = quoteStatus[code];

  if (!status) {
    return undefined;
  }

  const { idLang, ...restQuoteStatus } = status;

  return { ...restQuoteStatus, name: b3Lang(idLang) };
};

export default function QuoteStatus(props: OrderStatusProps) {
  const b3Lang = useB3Lang();
  const { code } = props;

  const status = getOrderStatus(code, b3Lang);

  if (!status?.name) {
    return null;
  }

  return (
    <B3Tag color={status.color} textColor={status.textColor}>
      {status.name}
    </B3Tag>
  );
}
