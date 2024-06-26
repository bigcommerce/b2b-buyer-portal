import { store } from '@/store';
import { TaxZoneRates, TaxZoneRatesProps } from '@/store/slices/global';

const getTaxRate = (taxClassId: number) => {
  const {
    global: { taxZoneRates },
  } = store.getState();

  let taxRates: TaxZoneRates[] = [];

  if (taxZoneRates.length) {
    const withValueTaxZoneRates =
      taxZoneRates.filter(
        (taxZoneRate: TaxZoneRatesProps) => taxZoneRate.rates.length > 0 && taxZoneRate.enabled,
      ) || [];

    if (withValueTaxZoneRates.length > 0) {
      const currentTaxZoneRate =
        withValueTaxZoneRates.find(
          (taxZoneRate: TaxZoneRatesProps) =>
            taxZoneRate.rates[0]?.priority === 0 && taxZoneRate.rates[0].enabled,
        ) || withValueTaxZoneRates[0];

      taxRates = currentTaxZoneRate?.rates[0]?.classRates || [];
    }
  }

  const rate = taxRates.find((item) => item.taxClassId === taxClassId)?.rate || 0;

  return rate;
};

export default getTaxRate;
