import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { Resizable } from 'react-resizable';
import { Box } from '@mui/material';
import PDFObject from 'pdfobject';

import B3Sping from '@/components/spin/B3Sping';
import { snackbar } from '@/utils';

import { handlePrintPDF } from '../utils/pdf';

interface RowList {
  [key: string]: CustomFieldItems | string | number;
  id: string;
  createdAt: number;
  updatedAt: number;
}

const templateMinHeight = 300;

interface PrintTempalteProps {
  row: RowList;
}

function PrintTempalte({ row }: PrintTempalteProps) {
  const container = useRef<HTMLInputElement | null>(null);

  const dom = useRef<HTMLInputElement | null>(null);

  const [loadding, setLoadding] = useState<boolean>(false);

  const [height, setHeight] = useState<number>(templateMinHeight);

  const onFirstBoxResize = (
    event: SyntheticEvent<Element, Event>,
    { size }: { size: { height: number } },
  ) => {
    setHeight(size.height);
  };

  useEffect(() => {
    const viewPrint = async () => {
      setLoadding(true);
      const { id: invoiceId } = row;

      const invoicePDFUrl = await handlePrintPDF(invoiceId);

      if (!invoicePDFUrl) {
        snackbar.error('pdf url resolution error');
        return;
      }

      if (!container?.current) return;

      PDFObject.embed(invoicePDFUrl, container.current);

      setLoadding(false);
    };

    viewPrint();

    return () => {
      container.current = null;
    };
  }, [row]);

  return (
    <B3Sping isSpinning={loadding}>
      <Box
        ref={dom}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          '& .box': {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            '& .react-resizable': {
              position: 'relative',
            },
            '& .react-resizable-handle': {
              position: 'absolute',
              width: '100%',
              height: '30px',
              backgroundRepeat: 'no-repeat',
              backgroundOrigin: 'content-box',
              boxSizing: 'border-box',
            },
            '& .react-resizable-handle-s': {
              cursor: 'ns-resize',
              bottom: 0,
            },
          },
        }}
      >
        <Resizable
          className="box"
          height={height}
          minConstraints={[dom?.current?.offsetWidth || 0, 0]}
          width={dom.current?.offsetWidth || 0}
          onResize={onFirstBoxResize}
          resizeHandles={['s']}
        >
          <div style={{ width: '100%', height: `${height}px` }}>
            <div ref={container} style={{ height: '100%', width: '100%' }} />
          </div>
        </Resizable>
      </Box>
    </B3Sping>
  );
}

export default PrintTempalte;
