export const NewAdInfoObject = {
  marketplaceId: 3,
  price: 300,
  productId: 3,
};

export const AdInfoObject = {
  ...NewAdInfoObject,
  score: 9,
  isActive: true,
  skuId: 0,
  id: 0,
};

export const MarketplaceObj = {
  id: 9,
  name: "wecode",
};
export type Marketplace = typeof MarketplaceObj;

export type AdInfo = typeof AdInfoObject;
export type NewAdInfo = typeof NewAdInfoObject;

export const UpdatingAdInfoObject: Partial<Omit<typeof AdInfoObject, "id">> = Object.entries(NewAdInfoObject).reduce(
  (accumulator, [key, value]) => {
    if (key === "id") {
      return accumulator;
    }
    if (key) {
      Object.assign(accumulator, { [key]: value });
    }

    return accumulator;
  },
  {} as Partial<Omit<typeof AdInfoObject, "id">>
);

export type UpdatingAdInfo = typeof UpdatingAdInfoObject;

export type AdContext = ProductInfo &
  SkuInfo &
  AdInfo & {
    images?: {
      isMain: boolean;
      url: string;
      name: string;
    }[];
  };

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type TableFields = {
  products: ProductInfo;
  sku: SkuInfo;
  sku_inventory: InventoryInfo;
  sku_file: SkuFile;
};
export const NewProductInfoObject = {
  userId: "",
  name: "",
  departmentId: 0,
  categoryId: 0,
  brandId: 0,
  linkId: "",
  refId: "",
  isVisible: true,
  description: "",
  descriptionShort: "",
  releaseDate: "",
  keyWords: "",
  title: "",
  taxCode: "",
  metaTagDescription: "",
  supplierId: "",
  showWithoutStock: true,
  adWordsRemarketingCode: "",
  lomadeeCampaignCode: "",
  isActive: true,
  score: 0,
};
export const ProductInfoObject = {
  ...NewProductInfoObject,
  id: 0,
};

export type ProductInfo = typeof ProductInfoObject;
export type NewProductInfo = typeof NewProductInfoObject;
export type UpdatingProductInfo = Partial<typeof NewProductInfoObject>;
export const NewSkuInfoObject = {
  isPersisted: false,
  productId: 0,
  isActive: true,
  name: "",
  height: 0,
  realHeight: 0,
  width: 0,
  realWidth: 0,
  length: 0,
  realLength: 0,
  weightKg: 0,
  realWeightKg: 0,
  modalId: 0,
  refId: "",
  cubicWeight: 0,
  isKit: true,
  internalNote: "",
  dateUpdated: "",
  rewardValue: 0,
  commercialConditionId: 0,
  estimatedDateArrival: "",
  flagKitItensSellApart: false,
  manufacturerCode: "",
  referenceStockKeepingUnitId: "",
  position: 0,
  activateIfPossible: true,
  measurementUnit: "",
  unitMultiplier: 0,
  isInventoried: false,
  isTransported: false,
  isGiftCardRecharge: false,
  modalType: "",
  isKitOptimized: false,
};

export const SkuInfoObject = {
  ...NewSkuInfoObject,
  id: 0,
};

export type SkuInfo = typeof SkuInfoObject;
export type NewSkuInfo = typeof NewSkuInfoObject;
export type UpdatingSkuInfo = Partial<Omit<SkuInfo, "id">>;
export const NewSkuInventoryObject = {
  warehouseId: "123",
  warehouseName: "estoque name test",
  totalQuantity: 0,
  reservedQuantity: 0,
  hasUnlimitedQuantity: false,
  timeToRefill: null,
  dateOfSupplyUtc: null,
  leadTime: "00:00:00",
  isActive: true,
  skuId: 0,
};
export const SkuInventoryInfoObject = {
  id: 0,
  ...NewSkuInventoryObject,
};
export const UpdatingSkuInventoryObject = {
  warehouseId: "123",
  warehouseName: "estoque name test",
  totalQuantity: 0,
  reservedQuantity: 0,
  hasUnlimitedQuantity: false,
  timeToRefill: null,
  dateOfSupplyUtc: null,
  leadTime: "00:00:00",
  isActive: true,
};
export type InventoryInfo = typeof SkuInventoryInfoObject;
export type NewInventoryInfo = typeof NewSkuInventoryObject;
export type UpdatingSkuInventoryInfo = typeof UpdatingSkuInventoryObject;

export const NewSkuFileObject = {
  archiveId: 0,
  skuId: 0,
  name: "",
  isMain: false,
  url: "",
  label: "",
};
export const SkuFileObject = {
  id: 0,
  ...NewSkuFileObject,
  skuId: 0,
};

export type SkuFile = typeof SkuFileObject;
export type NewSkuFile = typeof NewSkuFileObject;
export type UpdatingSkuFile = Partial<Omit<Omit<SkuFile, "id">, "archiveId">>;
