const showPageMask = (showMask: boolean) => {
  const bodyMask = document.getElementById('body-mask');

  if (showMask) {
    if (bodyMask) {
      bodyMask.style.display = 'block';
    } else {
      const maskDiv = document.createElement('div');
      maskDiv.setAttribute('id', 'body-mask');
      maskDiv.innerText = 'Loading...';

      document.body.appendChild(maskDiv);
      maskDiv.style.display = 'none';
    }
  } else if (bodyMask) {
    bodyMask.style.display = 'none';
  }
};

export { showPageMask };
