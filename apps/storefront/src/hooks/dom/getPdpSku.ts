export const getPdpSku = (skuElement: Element | null, useTextContent: boolean): string => {
  const value = useTextContent ? skuElement?.textContent : skuElement?.innerHTML;

  return (value ?? '').trim();
};
