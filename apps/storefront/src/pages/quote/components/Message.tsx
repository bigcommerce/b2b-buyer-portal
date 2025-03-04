import {
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useB3Lang } from '@b3/lang';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Card, CardContent, TextField, Tooltip, useTheme } from '@mui/material';
import { format, formatDistanceStrict } from 'date-fns';

import { B3CollapseContainer } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { GlobalContext } from '@/shared/global';
import { updateB2BQuote, updateBCQuote } from '@/shared/service/b2b';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { displayExtendedFormat, storeHash } from '@/utils';

interface MessageProps {
  date?: number;
  message?: string;
  role?: string;
  isCustomer?: boolean;
  key?: number | string;
  read?: number;
  sendTime?: number;
}

interface MsgsProps {
  msgs: MessageProps[];
  id: string | number;
  email: string;
  isB2BUser: boolean;
  status: number;
}

interface CustomerMessageProps {
  msg: MessageProps;
  isEndMessage?: boolean;
  isCustomer?: boolean;
}

function ChatMessage({ msg, isEndMessage, isCustomer }: CustomerMessageProps) {
  const b3Lang = useB3Lang();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: `${isCustomer ? 'flex-end' : 'flex-start'}`,
        paddingTop: '5px',
      }}
    >
      {msg?.role && (
        <Box
          sx={{
            height: '14px',
            fontWeight: 400,
            lineHeight: '14px',
            fontSize: '10px',
            letterSpacing: '0.17px',
            color: 'rgba(0, 0, 0, 0.38)',
          }}
        >
          {msg.role}
        </Box>
      )}
      {msg?.message && (
        <Box
          sx={{
            display: 'inline-block',
            lineHeight: '34px',
            padding: '0 10px',
            background: `${isCustomer ? 'rgba(25, 118, 210, 0.3)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '18px',
            m: '1px',
          }}
        >
          <Tooltip title={format((msg.sendTime || 0) * 1000, 'K:m aa')} placement="top" arrow>
            <Box
              sx={{
                wordBreak: 'break-word',
              }}
            >
              {msg.message}
            </Box>
          </Tooltip>
          {isEndMessage && (
            <Box
              sx={{
                height: '14px',
                fontWeight: 400,
                lineHeight: '14px',
                fontSize: '10px',
                letterSpacing: '0.17px',
                color: 'rgba(0, 0, 0, 0.38)',
              }}
            >
              {`${b3Lang('quoteDetail.message.sent')} ${formatDistanceStrict(
                new Date((msg.sendTime || 0) * 1000),
                new Date(),
                {
                  addSuffix: true,
                },
              )}`}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

interface DateMessageProps {
  msg: MessageProps;
}

function DateMessage({ msg }: DateMessageProps) {
  return (
    <Box
      sx={{
        color: 'rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
        height: '21px',
        mb: '5px',
      }}
    >
      {`${displayExtendedFormat(msg?.date || 0)}`}
    </Box>
  );
}

function Message({ msgs, id, isB2BUser, email, status }: MsgsProps) {
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const b3Lang = useB3Lang();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const changeReadRef = useRef(0);

  const [messages, setMessages] = useState<MessageProps[]>([]);

  const [read, setRead] = useState<number>(0);

  const [message, setMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const { quotesUpdateMessageActionsPermission } = useAppSelector(rolePermissionSelector);
  const quotesUpdateMessagePermission = isB2BUser ? quotesUpdateMessageActionsPermission : true;

  const convertedMsgs = (msgs: MessageProps[]) => {
    let nextMsg: MessageProps = {};
    const getNewMsgs: MessageProps[] = [];
    let readNum = 0;
    msgs.forEach((msg: MessageProps, index: number) => {
      if (index === 0) {
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          date: msg?.date,
          key: `${msg?.date}date`,
        });
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          message: msg.message,
          sendTime: msg.date,
          role: msg.role,
          key: msg?.date,
        });
        nextMsg = msg;
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:');
      } else {
        if ((msg?.date || 0) - (nextMsg?.date || 0) > 60 * 60) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            date: msg?.date,
            key: `${msg?.date}date`,
          });
        }

        if (nextMsg.isCustomer === !msg.role?.includes('Sales rep:')) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            sendTime: msg.date,
            key: msg?.date,
          });
        } else {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            role: msg.role,
            sendTime: msg.date,
            key: msg?.date,
          });
        }
        nextMsg = msg;
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:');
      }

      if (msg.role?.includes('Sales rep:') && !msg.read) {
        readNum += 1;
      }
    });

    setRead(readNum);

    setMessages(getNewMsgs);
  };

  const title = useMemo(
    () => (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {`${b3Lang('quoteDetail.message.message')} `}
        {read !== 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: primaryColor || '#1976D2',
              color: '#fff',
              fontSize: '12px',
              ml: '8px',
            }}
          >
            {read}
          </Box>
        )}
      </Box>
    ),
    // disabling this rule as b3Lang will cause rendering issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryColor, read],
  );

  useEffect(() => {
    convertedMsgs(msgs);
  }, [msgs]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [messages]);

  const updateMsgs = async (msg: string) => {
    try {
      const fn = isB2BUser ? updateB2BQuote : updateBCQuote;
      setLoading(true);
      const {
        quoteUpdate: {
          quote: { trackingHistory },
        },
      } = await fn({
        id: Number(id),
        quoteData: {
          message: msg,
          lastMessage: parseInt(`${new Date().getTime() / 1000}`, 10),
          userEmail: email || '',
          storeHash,
        },
      });
      setMessage('');
      setRead(0);
      convertedMsgs(trackingHistory);
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateMsgs((e.target as HTMLInputElement).value || '');
    }
  };

  const handleOnChange = useCallback(
    (open: boolean) => {
      if (open) {
        if (!quotesUpdateMessagePermission && isB2BUser) return;
        const fn = isB2BUser ? updateB2BQuote : updateBCQuote;
        if (changeReadRef.current === 0 && msgs.length) {
          fn({
            id: Number(id),
            quoteData: {
              lastMessage: msgs[msgs.length - 1]?.date,
              userEmail: email || '',
              storeHash,
            },
          });
        }
        setRead(0);
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
        changeReadRef.current += 1;
      }
    },
    [email, id, isB2BUser, msgs, quotesUpdateMessagePermission],
  );

  useEffect(() => {
    globalDispatch({
      type: 'common',
      payload: {
        quoteDetailHasNewMessages: read !== 0,
      },
    });
    // Disabling this rule as dispatcher dep globalDispatch is the same between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read]);

  return (
    <Card>
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer handleOnChange={handleOnChange} title={title}>
          <Box
            sx={{
              padding: '16px 0',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                color: 'rgba(0, 0, 0, 0.6)',
                opacity: 0.6,
                textAlign: 'left',
                width: '100%',
                fontSize: '14px',
              }}
            >
              {b3Lang('quoteDetail.message.merchantAnswers')}
            </Box>
            <Box
              ref={messagesEndRef}
              sx={{
                mt: '20px',
                maxHeight: '280px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              {messages.map((item: MessageProps, index: number) => (
                <Box key={item.key}>
                  <ChatMessage
                    msg={item}
                    isEndMessage={index === messages.length - 1}
                    isCustomer={!!item.isCustomer}
                  />
                  {item.date && <DateMessage msg={item} />}
                </Box>
              ))}
            </Box>
          </Box>

          {status !== 4 && quotesUpdateMessagePermission && (
            <B3Spin
              isSpinning={loading}
              spinningHeight={50}
              size={10}
              isCloseLoading
              tip="waiting.."
            >
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                }}
              >
                <TextField
                  onKeyDown={updateMessage}
                  sx={{
                    width: '100%',
                    '& .MuiFormLabel-root': {
                      color: 'rgba(0, 0, 0, 0.38)',
                    },
                    '& input': {
                      padding: '1.5rem 0.7rem 0.5rem',
                    },
                  }}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  size="small"
                  label={b3Lang('quoteDetail.message.typeMessage')}
                  variant="filled"
                />
                <Box
                  onClick={() => updateMsgs(message)}
                  sx={{
                    width: '42px',
                    height: '36px',
                    margin: '10px 0 0 10px',
                    background: '#BAD6F2',
                    borderRadius: '50%',
                  }}
                >
                  <ArrowUpwardIcon
                    sx={{
                      height: '18px',
                      width: '18px',
                      margin: '8px 0 0 9px',
                      color: '#0000008A',
                    }}
                    fontSize="small"
                  />
                </Box>
              </Box>
            </B3Spin>
          )}
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}

export default Message;
