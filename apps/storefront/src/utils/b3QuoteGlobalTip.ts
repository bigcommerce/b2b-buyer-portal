interface CreateTipProps {
  variant?: string
  cd?: () => void
  closeCd?: () => void
  linkSize?: string
}

export default class QuoteGlobalTip {
  variant: string

  message: string

  constructor() {
    this.variant = ''
    this.message = ''
  }

  static removeElement = (_element: CustomFieldItems) => {
    const _parentElement = _element.parentNode
    if (_parentElement) {
      _parentElement.removeChild(_element)
    }
  }

  static delete() {
    const isGlobalTip = document.querySelector('#globalTip')
    if (isGlobalTip) this.removeElement(isGlobalTip)
  }

  static createTip(message: string, {
    variant = 'success',
    cd,
    closeCd,
    linkSize,
  }: CreateTipProps) {
    this.delete()
    const globalTip = document.createElement('div')
    globalTip.setAttribute('id', 'globalTip')
    const tipHtml = `
    <div class="b2b-quote-global-alert ${variant === 'success' ? 'b2b-quote-global-success' : 'b2b-quote-global-error'}" role="alert">
      <div class="MuiAlert-icon b2b-quote-global-icon">
        <svg
          class="b2b-quote-global-svg"
          focusable="false"
          aria-hidden="true"
          viewBox="0 0 24 24"
          data-testid="SuccessOutlinedIcon"
        >
        ${variant === 'success' ? '<path d="M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"></path>'
    : '<path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path>'}
        </svg>
      </div>
      <div class="b2b-quote-global-message">
        <div>${message}</div>
      </div>
      <div class="b2b-quote-global-action">
          ${
  variant === 'success'
    ? `<button
            class="b2b-quote-global-btn b2b-quote-global-btn-goto"
            tabindex="0"
            type="button"
            aria-label="Close"
            title="Close"
          >
            ${linkSize}
          </button>` : ''
}
          <button
            class="b2b-quote-global-btn b2b-quote-global-btn-close"
            tabindex="0"
            type="button"
            aria-label="Close"
            title="Close"
          >
            <svg
              class="b2b-quote-global-btn-svg"
              focusable="false"
              aria-hidden="true"
              viewBox="0 0 24 24"
              data-testid="CloseIcon"
            >
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              ></path>
            </svg>
          </button>
      </div>
    </div>`
    globalTip.innerHTML = tipHtml

    document.body.append(globalTip)

    if (cd) cd()
    if (closeCd) closeCd()
  }
}
