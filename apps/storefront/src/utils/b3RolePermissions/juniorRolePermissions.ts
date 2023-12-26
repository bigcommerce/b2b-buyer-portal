import globalB3 from '@b3/global-b3'

const setCartPermissions = (role: number | string) => {
  if (+role === 2) return
  const carts = document.querySelectorAll(globalB3['dom.cartElement'])

  // remove cart Entrance
  if (carts.length > 0) {
    carts.forEach((cart: any) => {
      cart.style.display = ''
    })
  }
}

export default setCartPermissions
