import { createSelector } from '@reduxjs/toolkit'

import { RootState } from './reducer'

const themeSelector = (state: RootState) => state.theme
const storeConfigSelector = (state: RootState) => state.storeConfigs
const quoteInfoSelector = (state: RootState) => state.quoteInfo

export const themeFrameSelector = createSelector(
  themeSelector,
  (theme) => theme.themeFrame
)

export const defaultCurrencyCodeSelector = createSelector(
  storeConfigSelector,
  (storeConfigs) =>
    storeConfigs.currencies.currencies.find((currency) => currency.is_default)
)

export const formatedQuoteDraftListSelector = createSelector(
  quoteInfoSelector,
  (quoteInfo) =>
    quoteInfo.draftQuoteList.map(
      ({
        node: { optionList, calculatedValue, productsSearch, ...restItem },
      }) => {
        const parsedOptionList: Record<string, string>[] =
          JSON.parse(optionList)
        const optionSelections = parsedOptionList.map(
          ({ optionId, optionValue }) => {
            const optionIdFormated = optionId.match(/\d+/)
            return {
              optionId: optionIdFormated?.length
                ? +optionIdFormated[0]
                : optionId,
              optionValue: +optionValue,
            }
          }
        )
        return {
          ...restItem,
          optionSelections,
        }
      }
    )
)
