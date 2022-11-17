export interface OrderStatusItem {
  customLabel: string,
  statusCode: string,
  systemLabel: string,
}

export interface OrderStatusResponse {
  orderStatuses?:OrderStatusItem[]
  bcOrderStatuses?:OrderStatusItem[]
}
