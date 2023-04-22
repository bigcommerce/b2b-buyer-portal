const removeCartPermissions = (role: number | string) => {
  if (+role !== 2) return
  const carts = document.querySelectorAll('[href="/cart.php"]')
  const cartBtn = document.querySelectorAll('#form-action-addToCart')
  const quickViewCartBtn = document.querySelectorAll(
    '[data-button-type="add-cart"]'
  )

  // remove cart Entrance
  if (carts.length > 0) {
    carts.forEach((cart: any) => {
      cart.style.display = 'none'
    })
  }

  // remove add to cart button
  if (cartBtn.length > 0) {
    cartBtn.forEach((cart: any) => {
      cart.style.display = 'none'
    })
  }

  // remove quick view page add to cart button
  if (quickViewCartBtn.length > 0) {
    quickViewCartBtn.forEach((cart: any) => {
      cart.style.display = 'none'
    })
  }
}

export default removeCartPermissions
