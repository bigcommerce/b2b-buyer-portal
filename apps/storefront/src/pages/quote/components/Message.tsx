import {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
  KeyboardEvent,
} from 'react'

import {
  Box,
  Card,
  CardContent,
  TextField,
  Tooltip,
} from '@mui/material'

import {
  format,
  formatDistanceStrict,
} from 'date-fns'

import {
  updateB2BQuote,
  updateBCQuote,
} from '@/shared/service/b2b'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  B3CollapseContainer,
} from '@/components'

import {
  storeHash,
} from '@/utils'

interface MessageProps {
  date?: number,
  message?: string,
  role?: string,
  isCustomer?: boolean
  key?: number | string
  read?: number
  sendTime?: number
}

interface MsgsProps {
  msgs: MessageProps[]
  id: string | number
  email: string
  isB2BUser: boolean
  status: number
}

interface CustomerMessageProps {
  msg: MessageProps,
  isEndMessage?: boolean,
  isCustomer?: boolean,
}

const ChatMessage = ({
  msg,
  isEndMessage,
  isCustomer,
}: CustomerMessageProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: `${isCustomer ? 'flex-end' : 'flex-start'}`,
    }}
  >
    {
      msg?.role && (
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
      )
    }
    {
      msg?.message && (
      <Box
        sx={{
          display: 'inline-block',
          height: '34px',
          lineHeight: '34px',
          padding: '0 10px',
          background: `${isCustomer ? 'rgba(25, 118, 210, 0.3)' : 'rgba(0, 0, 0, 0.12)'}`,
          borderRadius: '18px',
          m: '1px',
        }}
      >
        <Tooltip
          title={format((msg.sendTime || 0) * 1000, 'K:m aa')}
          placement="top"
          arrow
        >
          <Box>
            {msg.message}
          </Box>
        </Tooltip>
        {
         isEndMessage && (
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
           {`Sent ${formatDistanceStrict(new Date((msg.sendTime || 0) * 1000), new Date(), {
             addSuffix: true,
           })}`}

         </Box>
         )
        }
      </Box>
      )
    }

  </Box>
)

interface DateMessageProps {
  msg: MessageProps,
}

const DateMessage = ({
  msg,
}: DateMessageProps) => (
  <Box
    sx={{
      color: 'rgba(0, 0, 0, 0.6)',
      textAlign: 'center',
      height: '21px',
      mb: '5px',
    }}
  >
    {format((msg?.date || 0) * 1000, 'MMMM dd uuuu, K:m aa')}
  </Box>
)

const Message = ({
  msgs,
  id,
  isB2BUser,
  email,
  status,
}: MsgsProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const changeReadRef = useRef(0)

  const [messages, setMessages] = useState<MessageProps[]>([])

  const [read, setRead] = useState<number>(0)

  const [message, setMessage] = useState<string>('')

  const [loadding, setLoadding] = useState<boolean>(false)

  const convertedMsgs = (msgs: MessageProps[]) => {
    let nextMsg: MessageProps = {}
    const getNewMsgs: MessageProps[] = []
    let readNum = 0
    msgs.forEach((msg: MessageProps, index: number) => {
      if (index === 0) {
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          date: msg?.date,
          key: `${msg?.date}date`,
        })
        getNewMsgs.push({
          isCustomer: !msg.role?.includes('Sales rep:'),
          message: msg.message,
          sendTime: msg.date,
          role: msg.role,
          key: msg?.date,
        })
        nextMsg = msg
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:')
      } else {
        if (((msg?.date || 0) - (nextMsg?.date || 0)) > 60 * 60) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            date: msg?.date,
            key: `${msg?.date}date`,
          })
        }

        if (nextMsg.isCustomer === !msg.role?.includes('Sales rep:')) {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            sendTime: msg.date,
            key: msg?.date,
          })
        } else {
          getNewMsgs.push({
            isCustomer: !msg.role?.includes('Sales rep:'),
            message: msg.message,
            role: msg.role,
            sendTime: msg.date,
            key: msg?.date,
          })
        }
        nextMsg = msg
        nextMsg.isCustomer = !msg.role?.includes('Sales rep:')
      }

      if (msg.role?.includes('Sales rep:') && !msg.read) {
        readNum += 1
      }
    })

    setRead(readNum)

    setMessages(getNewMsgs)
  }

  const title = useMemo(() => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      Message
      {' '}
      {
        read !== 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#1976D2',
            color: '#fff',
            fontSize: '12px',
            ml: '8px',
          }}
        >
          {read}
        </Box>
        )
      }
    </Box>
  ), [read])

  useEffect(() => {
    convertedMsgs(msgs)
  }, [msgs])

  useEffect(() => {
    if (messagesEndRef.current && messages.length) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
    }
  }, [messages])

  const updateMsgs = async (msg: string) => {
    try {
      const fn = isB2BUser ? updateB2BQuote : updateBCQuote
      setLoadding(true)
      const {
        quoteUpdate: {
          quote: {
            trackingHistory,
          },
        },
      } = await fn({
        id: +id,
        quoteData: {
          message: msg,
          lastMessage: parseInt(`${new Date().getTime() / 1000}`, 10),
          userEmail: email || '',
          storeHash,
        },
      })
      setMessage('')
      setRead(0)
      convertedMsgs(trackingHistory)
    } finally {
      setLoadding(false)
    }
  }

  const updateMessage = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateMsgs((e.target as HTMLInputElement).value || '')
    }
  }

  const handleOnChange = useCallback((open: boolean) => {
    if (open) {
      const fn = isB2BUser ? updateB2BQuote : updateBCQuote
      if (changeReadRef.current === 0 && msgs.length) {
        fn({
          id: +id,
          quoteData: {
            lastMessage: msgs[msgs.length - 1]?.date,
            userEmail: email || '',
            storeHash,
          },
        })
      }
      setRead(0)
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
      }
      changeReadRef.current += 1
    }
  }, [msgs])
  return (
    <Card>
      <CardContent>
        <B3CollapseContainer
          handleOnChange={handleOnChange}
          title={title}
        >
          <Box sx={{
            padding: '16px 0',
          }}
          >
            <Box
              sx={{
                position: 'relative',
                color: 'rgba(0, 0, 0, 0.6)',
                opacity: 0.6,
                textAlign: 'center',
                width: '100%',
                fontSize: '14px',
              }}
            >
              Merchant typically answers within 1 day

            </Box>
            <Box
              ref={messagesEndRef}
              sx={{
                mt: '20px',
                maxHeight: '280px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  // width: '2px',
                  // height: '2px',
                  display: 'none',
                },
                // '&::-webkit-scrollbar-thumb': {
                //   backgroundColor: '#908b8b',
                // },
              }}
            >
              {
              messages.map((item: MessageProps, index: number) => (
                <Box key={item.key}>
                  <ChatMessage
                    msg={item}
                    isEndMessage={index === messages.length - 1}
                    isCustomer={!!item.isCustomer}
                  />
                  {
                    item.date && <DateMessage msg={item} />
                  }
                </Box>
              ))
            }
            </Box>

          </Box>

          {
              status !== 4 && (
                <B3Sping
                  isSpinning={loadding}
                  spinningHeight={50}
                  size={10}
                  isCloseLoading
                  tip="waiting.."
                >
                  <Box
                    sx={{
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
                      }}
                      value={message}
                      onChange={(event) => { setMessage(event.target.value) }}
                      size="small"
                      label="Type a message..."
                      variant="filled"
                    />
                  </Box>
                </B3Sping>

              )
            }

        </B3CollapseContainer>
      </CardContent>
    </Card>
  )
}

export default Message
