import {
  useState,
  useContext,
  useRef,
  forwardRef,
  Ref,
  ReactElement,
  Dispatch,
  SetStateAction,
  useImperativeHandle,
} from 'react'

import {
  Box,
  styled,
  Typography,
} from '@mui/material'

import {
  getOrderedProducts,
  searchB2BProducts,
} from '@/shared/service/b2b'

import {
  snackbar,
  getDefaultCurrencyInfo,
  distanceDay,
} from '@/utils'

import {
  TableColumnItem,
} from '@/components/table/B3Table'

import {
  B3PaginationTable,
} from '@/components/table/B3PaginationTable'

import {
  useMobile,
} from '@/hooks'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  conversionProductsList,
  getProductOptionsFields,
} from '../../shoppingListDetails/shared/config'

import B3FilterSearch from '../../../components/filter/B3FilterSearch'

import B3FilterPicker from '../../../components/filter/B3FilterPicker'

import B3FilterMore from '../../../components/filter/B3FilterMore'

import QuickOrderCard from './QuickOrderCard'

interface ListItem {
  [key: string]: string
}

interface ProductInfoProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: string,
  primaryImage: string,
  productId: number,
  productName: string,
  productUrl: string,
  quantity: number | string,
  tax: number | string,
  updatedAt: number,
  variantId: number,
  variantSku: string,
  productsSearch: CustomFieldItems,
}

interface ListItemProps {
  node: ProductInfoProps,
}

// interface ShoppingDetailTableProps {
//   shoppingListInfo: any,
//   currencyToken: string,
//   isRequestLoading: boolean,
//   setIsRequestLoading: Dispatch<SetStateAction<boolean>>,
//   shoppingListId: number | string,
//   getShoppingListDetails: CustomFieldItems,
//   setCheckedArr: (values: CustomFieldItems) => void,
//   isReadForApprove: boolean,
//   setDeleteItemId: (itemId: number | string) => void,
//   setDeleteOpen: (open: boolean) => void,
// }

interface SearchProps {
  q: string,
  first?: number,
  offset?: number,
  beginDateAt?: Date | string | number,
  endDateAt?: Date | string | number,
}

interface PaginationTableRefProps extends HTMLInputElement {
  getList: () => void,
  setList: (items?: ListItemProps[]) => void,
  getSelectedValue: () => void,
}

const StyledImage = styled('img')(() => ({
  maxWidth: '60px',
  height: 'auto',
  marginRight: '0.5rem',
}))

const defaultProductImage = 'https://cdn11.bigcommerce.com/s-1i6zpxpe3g/stencil/cd9e3830-4c73-0139-8a51-0242ac11000a/e/4fe76590-73f1-0139-3767-32e4ea84ca1d/img/ProductDefault.gif'

interface QuickorderTableProps {
  setIsRequestLoading: Dispatch<SetStateAction<boolean>>,
}

const QuickorderTable = ({
  setIsRequestLoading,
}: QuickorderTableProps, ref: Ref<unknown>) => {
  const paginationTableRef = useRef<PaginationTableRefProps | null>(null)

  const [search, setSearch] = useState<SearchProps>({
    q: '',
    beginDateAt: distanceDay(30),
    endDateAt: distanceDay(),
  })

  const [checkedArr, setCheckedArr] = useState<CustomFieldItems>([])

  const [total, setTotalCount] = useState<number>(0)

  const [isMobile] = useMobile()

  const {
    state: {
      role,
      isAgenting,
      salesRepCompanyId,
      companyInfo: {
        id: companyInfoId,
      },
    },
  } = useContext(GlobaledContext)

  useImperativeHandle(ref, () => ({
    getCheckedList: () => checkedArr,
  }))

  const {
    currency_code: currencyCode,
    token: currencyToken,
  } = getDefaultCurrencyInfo()

  const handleGetProductsById = async (listProducts: ListItemProps[]) => {
    if (listProducts.length > 0) {
      const productIds: number[] = []
      listProducts.forEach((item) => {
        const {
          node,
        } = item
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId)
        }
      })

      try {
        const companyId = role === 3 && isAgenting ? +salesRepCompanyId : +companyInfoId
        const {
          productsSearch,
        } = await searchB2BProducts({
          productIds,
          currencyCode,
          companyId,
        })

        const newProductsSearch = conversionProductsList(productsSearch)

        listProducts.forEach((item) => {
          const {
            node,
          } = item

          const productInfo = newProductsSearch.find((search: CustomFieldItems) => {
            const {
              id: productId,
            } = search

            return node.productId === productId
          })

          node.productsSearch = productInfo || {}
        })

        return listProducts
      } catch (err: any) {
        snackbar.error(err)
      }
    }
  }

  const getList = async (params: SearchProps) => {
    // const {
    //   edges: edges1,
    //   totalCount: totalCount1,
    // } = await getOrderedProducts(params)

    // // TODO
    // console.log(params, edges1, totalCount1)

    const edges: any = [
      {
        node: {
          id: '35746',
          createdAt: 1675928313,
          updatedAt: 1675928328,
          productId: 115,
          variantId: 143,
          quantity: 5,
          productName: 'test-001',
          optionList: '[{"option_id": "attribute[130]", "option_value": "136"}, {"option_id": "attribute[131]", "option_value": "140"}, {"option_id": "attribute[135]", "option_value": "142"}, {"option_id": "attribute[132]", "option_value": "qwe"}, {"option_id": "attribute[133]", "option_value": "123123"}, {"option_id": "attribute[134]", "option_value": "12321322"}, {"option_id": "attribute[137]", "option_value": "146"}, {"option_id": "attribute[138]", "option_value": "148"}, {"option_id": "attribute[139]", "option_value": ""}, {"option_id": "attribute[140][year]", "option_value": "2023"}, {"option_id": "attribute[140][month]", "option_value": "1"}, {"option_id": "attribute[140][day]", "option_value": "6"}, {"option_id": "attribute[142]", "option_value": "153"}]',
          itemId: 35746,
          baseSku: 'TP-001',
          variantSku: 'TP-001-RE-ME-SE',
          basePrice: '20.00',
          discount: '0.00',
          tax: '10.00',
          enteredInclusive: false,
          productUrl: '/test-001/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/115/images/377/2021108165919.bmp-2021-10-08-17-05-09-167__55866.1672280600.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35739',
          createdAt: 1675823731,
          updatedAt: 1675928223,
          productId: 77,
          variantId: 12,
          quantity: 5,
          productName: '[Sample] Fog Linen Chambray Towel - Beige Stripe',
          optionList: '[{"option_id": "attribute[108]", "option_value": "69"}, {"option_id": "attribute[109]", "option_value": "9"}]',
          itemId: 35739,
          baseSku: 'SLCTBS',
          variantSku: 'SLCTBS-5819AF19',
          basePrice: '49.00',
          discount: '0.00',
          tax: '24.50',
          enteredInclusive: false,
          productUrl: '/fog-linen-chambray-towel-beige-stripe/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/77/images/266/foglinenbeigestripetowel1b.1658299629.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35644',
          createdAt: 1671761199,
          updatedAt: 1675670525,
          productId: 98,
          variantId: 70,
          quantity: 2,
          productName: '[Sample] Laundry Detergent',
          optionList: '[]',
          itemId: 35644,
          baseSku: 'CGLD',
          variantSku: 'CGLD',
          basePrice: '29.95',
          discount: '0.00',
          tax: '6.00',
          enteredInclusive: false,
          productUrl: '/laundry-detergent/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/98/images/327/CommonGoodLaundrySoap.1658299630.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35643',
          createdAt: 1671761198,
          updatedAt: 1671761198,
          productId: 104,
          variantId: 72,
          quantity: 1,
          productName: '[Sample] Utility Caddy',
          optionList: '[]',
          itemId: 35643,
          baseSku: 'OFSUC',
          variantSku: 'OFSUC',
          basePrice: '45.95',
          discount: '0.00',
          tax: '4.60',
          enteredInclusive: false,
          productUrl: '/-sample-utility-caddy/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/104/images/336/utilitybucket1.1658299630.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35642',
          createdAt: 1671761198,
          updatedAt: 1675927951,
          productId: 97,
          variantId: 69,
          quantity: 5,
          productName: '[Sample] Tiered Wire Basket',
          optionList: '[]',
          itemId: 35642,
          baseSku: 'TWB',
          variantSku: 'TWB',
          basePrice: '119.95',
          discount: '0.00',
          tax: '60.00',
          enteredInclusive: false,
          productUrl: '/tiered-wire-basket/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/97/images/325/tieredbasket.1658299630.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35641',
          createdAt: 1671761198,
          updatedAt: 1671761198,
          productId: 107,
          variantId: 73,
          quantity: 1,
          productName: '[Sample] Dustpan & Brush',
          optionList: '[]',
          itemId: 35641,
          baseSku: 'DPB',
          variantSku: 'DPB',
          basePrice: '34.95',
          discount: '0.00',
          tax: '3.50',
          enteredInclusive: false,
          productUrl: '/-sample-dustpan-brush/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/107/images/351/dustpan1.1658299630.220.290.jpg?c=1',
        },
      },
      {
        node: {
          id: '35640',
          createdAt: 1671761197,
          updatedAt: 1671761197,
          productId: 88,
          variantId: 67,
          quantity: 1,
          productName: '[Sample] Chemex Coffeemaker 3 Cup',
          optionList: '[]',
          itemId: 35640,
          baseSku: 'CC3C',
          variantSku: 'CC3C',
          basePrice: '49.50',
          discount: '0.00',
          tax: '4.95',
          enteredInclusive: false,
          productUrl: '/chemex-coffeemaker-3-cup/',
          primaryImage: 'https://cdn11.bigcommerce.com/s-al0cfwwv8r/products/88/images/292/3cupchemex5.1658299630.220.290.jpg?c=1',
        },
      },
    ]

    const totalCount = 7
    const listProducts = await handleGetProductsById(edges)

    setTotalCount(totalCount)

    return {
      edges: listProducts,
      totalCount,
    }
  }

  const handleSearchProduct = async (q: string) => {
    setSearch({
      q,
    })
  }

  const getSelectCheckbox = (selectCheckbox: Array<string | number>) => {
    if (selectCheckbox.length > 0) {
      const productList = paginationTableRef.current?.getList() || []
      const checkedItems = selectCheckbox.map((item: number | string) => {
        const newItems = productList.find((product: ListItemProps) => {
          const {
            node,
          } = product

          return node.id === item
        })

        return newItems
      })

      setCheckedArr([...checkedItems])
    } else {
      setCheckedArr([])
    }
  }

  const handlePickerChange = (key: string, value: Date | string | number) => {
    const params = {
      ...search,
    }
    if (key === 'start') {
      params.beginDateAt = value
    } else {
      params.endDateAt = value
    }

    setSearch(params)
  }

  const handleFilterChange = (data: any) => {
    const params = {
      ...search,
    }

    params.beginDateAt = data.startValue

    params.endDateAt = data.endValue

    setSearch(params)
  }

  const columnItems: TableColumnItem<ListItem>[] = [
    {
      key: 'Product',
      title: 'Product',
      render: (row: CustomFieldItems) => {
        const product: any = {
          ...row.productsSearch,
          selectOptions: row.optionList,
        }
        const productFields = (getProductOptionsFields(product, {}))

        const optionList = JSON.parse(row.optionList)
        const optionsValue: CustomFieldItems[] = productFields.filter((item) => item.valueText)

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <StyledImage
              src={row.primaryImage || defaultProductImage}
              alt="Product-img"
              loading="lazy"
            />
            <Box>
              <Typography
                variant="body1"
                color="#212121"
              >
                {row.productName}
              </Typography>
              <Typography
                variant="body1"
                color="#616161"
              >
                {row.variantSku}
              </Typography>
              {
                (optionList.length > 0 && optionsValue.length > 0) && (
                  <Box>
                    {
                      optionsValue.map((option: any) => (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: '1.5',
                            color: '#455A64',
                          }}
                          key={option.valueLabel}
                        >
                          {`${option.valueLabel
                          }: ${option.valueText}`}
                        </Typography>
                      ))
                    }
                  </Box>
                )
              }
            </Box>
          </Box>
        )
      },
      width: '40%',
    },
    {
      key: 'Price',
      title: 'Price',
      render: (row) => {
        const price = +row.basePrice

        return (
          <Typography
            sx={{
              padding: '12px 0',
            }}
          >
            {`${currencyToken}${price.toFixed(2)}`}
          </Typography>
        )
      },
      width: '15%',
    },
    {
      key: 'Qty',
      title: 'Qty',
      render: (row) => (
        <Typography
          sx={{
            padding: '12px 0',
          }}
        >
          {row.quantity}
        </Typography>
      ),
      width: '15%',
    },
    {
      key: 'Total',
      title: 'Total',
      render: (row: CustomFieldItems) => {
        const {
          basePrice,
          quantity,
        } = row
        const total = +basePrice * +quantity

        return (
          <Box>
            <Typography
              sx={{
                padding: '12px 0',
              }}
            >
              {`${currencyToken}${total.toFixed(2)}`}
            </Typography>
          </Box>
        )
      },
      width: '20%',
    },
  ]

  return (

    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        sx={{
          fontSize: '24px',
          height: '50px',
        }}
      >
        {`${total} products`}
      </Typography>
      <Box
        sx={{
          marginBottom: '5px',
          display: 'flex',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : '40%',
            mr: '20px',
            display: 'flex',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
          }}
        >
          <B3FilterSearch
            h="48px"
            searchBGColor="rgba(0, 0, 0, 0.06)"
            handleChange={(e) => {
              handleSearchProduct(e)
            }}
          />

          {
              isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <B3FilterMore
                  fiterMoreInfo={[]}
                  startPicker={{
                    isEnabled: true,
                    label: 'From',
                    defaultValue: distanceDay(30),
                    pickerKey: 'start',
                  }}
                  endPicker={{
                    isEnabled: true,
                    label: 'To',
                    defaultValue: distanceDay(),
                    pickerKey: 'end',
                  }}
                  isShowMore
                  onChange={handleFilterChange}
                />
              </Box>
              )
            }

        </Box>

        {
            !isMobile && (
            <B3FilterPicker
              handleChange={handlePickerChange}
              xs={{
                mt: 0,
                height: '50px',
              }}
              startPicker={{
                isEnabled: true,
                label: 'From',
                defaultValue: distanceDay(30),
                pickerKey: 'start',
              }}
              endPicker={{
                isEnabled: true,
                label: 'To',
                defaultValue: distanceDay(),
                pickerKey: 'end',
              }}
            />
            )
          }

      </Box>

      <B3PaginationTable
        ref={paginationTableRef}
        columnItems={columnItems}
        rowsPerPageOptions={[10, 20, 50]}
        getRequestList={getList}
        searchParams={search}
        isCustomRender={false}
        showCheckbox
        disableCheckbox={false}
        hover
        labelRowsPerPage="Items per page:"
        showBorder={false}
        requestLoading={setIsRequestLoading}
        getSelectCheckbox={getSelectCheckbox}
        itemIsMobileSpacing={0}
        noDataText="No products found"
        renderItem={(row: ProductInfoProps, index?: number, checkBox?: () => ReactElement) => (
          <QuickOrderCard
            item={row}
            checkBox={checkBox}
            currencyToken={currencyToken}
          />
        )}
      />

    </Box>

  )
}

export default forwardRef(QuickorderTable)
