export interface QuoteConfig {
  [key: string]: string
}

export const getLogo = (quoteConfig:Array<QuoteConfig>): string => {
  const item:Array<QuoteConfig> = quoteConfig.filter((list:QuoteConfig) => list.key === 'quote_logo')

  return item[0].isEnabled
}
