import { useEffect } from 'react'
import globalB3 from '@b3/global-b3'

type WsProps = WebSocket | null

const B3Socket = () => {
  useEffect(() => {
    let ws: WsProps = null
    const socketInit = async () => {
      // 1. 获取socket Id
      // const {
      //   socketId,
      // } = await getB2BSocketId()

      const socketId = '1'

      if (socketId) {
        const url = `${globalB3.setting.b2b_socket_url}/${socketId}/`
        ws = new window.WebSocket(url)

        if (ws) {
          ws.onopen = () => {}
          ws.onerror = () => {}
          ws.onmessage = (evt: MessageEvent) => {
            console.log(evt)
          }
        }
      }
    }

    socketInit()

    return () => {
      if (ws) ws.close()
    }
  }, [])
}

export default B3Socket
