/* eslint-disable */

window.INITIALIZE_CAPTCHA_PREFIX = function () {
  if (window.grecaptcha === undefined) {
    return
  }

  if (window.WIDGET_TIMER_PREFIX !== null) {
    window.clearInterval(window.WIDGET_TIMER_PREFIX)
    window.WIDGET_TIMER_PREFIX = null
  }

  var sendMessage = function (eventType, payload) {
    window.parent.postMessage(
      'PREFIX' +
        JSON.stringify({
          type: eventType,
          payload: payload,
        }),
      'PARENT_ORIGIN'
    )
  }

  window.grecaptcha.render(
    'PREFIX',
    {
      callback: function (token) {
        sendMessage('CAPTCHA_SUCCESS', token)
      },
      'error-callback': function () {
        sendMessage('CAPTCHA_ERROR', null)
      },
      'expired-callback': function () {
        sendMessage('CAPTCHA_EXPIRED', null)
      },
    },
    true
  )
}

window.WIDGET_TIMER_PREFIX = window.setInterval(
  window.INITIALIZE_CAPTCHA_PREFIX,
  250
)
