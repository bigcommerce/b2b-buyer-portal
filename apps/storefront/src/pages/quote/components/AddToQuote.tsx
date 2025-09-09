import { useState } from 'react';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { Box, Card, CardContent, Divider } from '@mui/material';
import { v1 as uuid } from 'uuid';

import { B3CollapseContainer, B3Upload } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { PRODUCT_DEFAULT_IMAGE } from '@/constants';
import { useBlockPendingAccountViewPrice } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { searchProducts } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { calculateProductListPrice, validProductQty } from '@/utils/b3Product/b3Product';
import { conversionProductsList } from '@/utils/b3Product/shared/config';

import QuickAdd from '../../ShoppingListDetails/components/QuickAdd';
import SearchProduct from '../../ShoppingListDetails/components/SearchProduct';

interface AddToListProps {
  updateList: () => void;
  addToQuote: (products: CustomFieldItems[]) => Promise<boolean>;
}

export default function AddToQuote(props: AddToListProps) {
  const { updateList, addToQuote } = props;

  const companyId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const companyStatus = useAppSelector(({ company }) => company.companyInfo.status);

  const [isOpenBulkLoadCSV, setIsOpenBulkLoadCSV] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice();

  const b3Lang = useB3Lang();

  const getNewQuoteProduct = (products: CustomFieldItems[]) =>
    products.map((product) => {
      const {
        variantId,
        newSelectOptionList,
        id: productId,
        name: productName,
        quantity,
        variants = [],
        basePrice,
        taxPrice,
        calculatedValue,
      } = product;

      const variantInfo =
        variants.length === 1
          ? variants[0]
          : variants.find((item: CustomFieldItems) => item.variant_id === variantId);

      const { image_url: primaryImage = '', sku: variantSku } = variantInfo;

      let selectOptions;
      try {
        selectOptions = JSON.stringify(newSelectOptionList);
      } catch (error) {
        selectOptions = '[]';
      }

      const taxExclusive = variantInfo.bc_calculated_price.tax_exclusive;
      const taxInclusive = variantInfo.bc_calculated_price.tax_inclusive;

      const basePriceExclusiveTax = basePrice || taxExclusive;

      const tax = taxPrice || Number(taxInclusive) - Number(taxExclusive);

      return {
        node: {
          basePrice: basePriceExclusiveTax,
          taxPrice: tax,
          optionList: selectOptions,
          id: uuid(),
          primaryImage,
          productId,
          productName,
          calculatedValue,
          productsSearch: {
            ...product,
            selectOptions,
          },
          quantity,
          variantSku,
        },
      };
    });

  const addToList = async (products: CustomFieldItems[]) => {
    const newProducts = getNewQuoteProduct(products);
    const noSkuProducts = products.filter(({ sku, variantId, variants }) => {
      const currentProduct = variants.find(
        (item: CustomFieldItems) => item.variant_id === variantId || item.variantId === variantId,
      );

      const variantSku = currentProduct.sku;

      return !(sku || variantSku);
    });
    if (noSkuProducts.length > 0) {
      snackbar.error(b3Lang('quoteDraft.notification.cantAddProductsNoSku'));
    }

    if (noSkuProducts.length === products.length) return;

    const success = await addToQuote(newProducts);

    if (success) {
      snackbar.success(b3Lang('quoteDraft.notification.productSingular'));
    }
  };

  const quickAddToList = async (variantProducts: CustomFieldItems[]) => {
    const productIds = variantProducts.map((item) => item.productId);

    const { productsSearch } = await searchProducts({
      productIds,
      companyId,
      customerGroupId,
    });

    const productList = conversionProductsList(productsSearch).map((product: CustomFieldItems) => {
      const variantProduct =
        variantProducts.find(
          (variantProduct: CustomFieldItems) => variantProduct.productId === product.id,
        ) || {};

      const { variantId, newSelectOptionList, quantity } = variantProduct;

      return {
        ...product,
        variantId,
        newSelectOptionList,
        quantity,
      };
    });

    await calculateProductListPrice(productList);

    const newProducts = getNewQuoteProduct(productList);

    const success = await addToQuote(newProducts);

    if (success) {
      snackbar.success(b3Lang('quoteDraft.notification.productPlural'));
    }
  };

  const getOptionsList = (options: CustomFieldItems) => {
    if (options?.length === 0) return [];

    const option = options.map(
      ({ option_id: optionId, id }: { option_id: number | string; id: string | number }) => ({
        optionId: `attribute[${optionId}]`,
        optionValue: id,
      }),
    );

    return option;
  };

  const handleCSVAddToList = async (productsData: CustomFieldItems) => {
    setIsLoading(true);
    try {
      const { validProduct } = productsData;

      const productIds: number[] = [];
      validProduct.forEach((product: CustomFieldItems) => {
        const { products } = product;

        if (!productIds.includes(Number(products.productId))) {
          productIds.push(Number(products.productId));
        }
      });

      const { productsSearch } = await searchProducts({
        productIds,
        companyId,
        customerGroupId,
      });

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch);

      const newProducts: CustomFieldItems[] = [];
      validProduct.forEach((product: CustomFieldItems) => {
        const {
          products: { option, variantSku, productId, productName, variantId },
          qty,
        } = product;

        const optionsList = getOptionsList(option);

        const currentProductSearch = newProductInfo.find(
          (product: CustomFieldItems) => Number(product.id) === Number(productId),
        );

        const variantItem = currentProductSearch.variants.find(
          (item: CustomFieldItems) => item?.sku?.toUpperCase() === variantSku?.toUpperCase(),
        );

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: variantItem?.sku,
            variantId,
            productsSearch: {
              ...currentProductSearch,
              newSelectOptionList: optionsList,
              variantId,
            },
            primaryImage: variantItem.image_url || PRODUCT_DEFAULT_IMAGE,
            productName,
            quantity: Number(qty) || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice: variantItem.bc_calculated_price.as_entered,
            taxPrice:
              variantItem.bc_calculated_price.tax_inclusive -
              variantItem.bc_calculated_price.tax_exclusive,
          },
        };

        newProducts.push(quoteListitem);
      });

      const isSuccess = validProductQty(newProducts);
      if (isSuccess) {
        await calculateProductListPrice(newProducts, '2');

        const success = await addToQuote(newProducts);
        if (success) {
          snackbar.success(b3Lang('quoteDraft.notification.productPlural'));
        }
        updateList();
        setIsOpenBulkLoadCSV(false);
      } else {
        snackbar.error(b3Lang('quoteDraft.notification.errorRangeProducts'));
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUploadDiag = () => {
    if (blockPendingAccountViewPrice && companyStatus === 0) {
      snackbar.info(b3Lang('quoteDraft.notification.businessAccountPendingActivation'));
    } else {
      setIsOpenBulkLoadCSV(true);
    }
  };

  return (
    <Card>
      <CardContent
        sx={{
          p: '16px !important',
        }}
      >
        <B3CollapseContainer title={b3Lang('quoteDraft.collapseTitle.addToQuote')}>
          <SearchProduct
            updateList={updateList}
            addToList={addToList}
            type="quote"
            searchDialogTitle={b3Lang('quoteDraft.modalTitle.addToQuote')}
            addButtonText={b3Lang('quoteDraft.searchProduct.addToQuoteButton')}
          />

          <Divider />

          <QuickAdd
            updateList={updateList}
            quickAddToList={quickAddToList}
            level={1}
            buttonText={b3Lang('quoteDraft.button.addProductsToAddToQuote')}
          />

          <Divider />

          <Box
            sx={{
              margin: '20px 0 0',
            }}
          >
            <CustomButton variant="text" onClick={() => handleOpenUploadDiag()}>
              <UploadFileIcon
                sx={{
                  marginRight: '8px',
                }}
              />
              {b3Lang('quoteDraft.button.bulkUploadCSV')}
            </CustomButton>
          </Box>

          <B3Upload
            isOpen={isOpenBulkLoadCSV}
            setIsOpen={setIsOpenBulkLoadCSV}
            handleAddToList={handleCSVAddToList}
            isLoading={isLoading}
            withModifiers
          />
        </B3CollapseContainer>
      </CardContent>
    </Card>
  );
}
