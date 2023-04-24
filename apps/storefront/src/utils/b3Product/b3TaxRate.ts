import { store } from '@/store/reducer'
import { TaxZoneRates, TaxZoneRatesProps } from '@/store/slices/global'

const getTaxRate = (taxClassId: number) => {
  const {
    global: { taxZoneRates },
  } = store.getState()

  let taxRates: TaxZoneRates[] = []

  if (taxZoneRates.length) {
    taxZoneRates.forEach((taxZoneRate: TaxZoneRatesProps) => {
      if (taxZoneRate.rates[0].priority === 1) {
        taxRates = taxZoneRate?.rates[0]?.classRates || []
      }
    })
  }

  const rate =
    taxRates.find((item) => item.taxClassId === taxClassId)?.rate || 0

  return rate
}

export default getTaxRate
