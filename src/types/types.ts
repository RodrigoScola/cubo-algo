export const PostStatus = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const NewAdInfoObject = {
  marketplaceId: 3,
  skuId: 0,
  price: 300,
  productId: 3,
  adType: "",
  status: 0 as PostStatus,
};

export const AdInfoObject = {
  ...NewAdInfoObject,
  score: 9,
  status: 0,
  skuId: 0,
  id: 0,
};

export const NewInteractionObject = {
  clicks: 0,
  views: 0,
  ctr: 0,
};

export const InteractionObject = {
  ...NewInteractionObject,
  id: 0,
};
export type Interaction = typeof InteractionObject;

export type InteractionType = keyof NewInteraction;

export type NewInteraction = typeof NewInteractionObject;
export const MarketplaceObj = {
  id: 9,
  name: "wecode",
};
export type Marketplace = typeof MarketplaceObj;

export type AdInfo = typeof AdInfoObject & {
  adType: "product" | "banner";
};
export type NewAdInfo = typeof NewAdInfoObject & {
  adType: "product" | "banner";
  status: PostStatus;
};

export const UpdatingAdInfoObject: Partial<Omit<AdInfo, "id">> = Object.entries(NewAdInfoObject).reduce(
  (accumulator, [key, value]) => {
    if (key === "id") {
      return accumulator;
    }
    if (key) {
      Object.assign(accumulator, { [key]: value });
    }

    return accumulator;
  },
  {} as Partial<Omit<AdInfo, "id">>
);

export type UpdatingAdInfo = typeof UpdatingAdInfoObject;

export type AdContext = ProductInfo &
  SkuInfo &

  Interaction &
  AdInfo & {
    inventory: {
      total: number,
      hasInventory: boolean,
      inventory: InventoryInfo[];
    },
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
  status: 0,
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
  status: 0,
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
  skuId: 25,
  warehouseId: "1_1",
  previousSkuId: 0,
  totalQuantity: 0,
  reservedQuantity: 0,
  availableQuantity: 0,
  isUnlimited: false,
  timeToRefill: null,
  dateOfSupplyUtc: null,
  supplyLotId: null,
  keepSellingAfterExpiration: false,
  transfer: null,
  leadTime: "00:00:00",
  previousWarehouseId: "",
  marketplaceId: 0 as MARKETPLACES,
  status: 0 as PostStatus,
  id: "",
};
export const SkuInventoryInfoObject = {
  ...NewSkuInventoryObject,
};
export const UpdatingSkuInventoryObject = {
  skuId: 25,
  warehouseId: "1_1",
  previousSkuId: 0,
  totalQuantity: 0,
  reservedQuantity: 0,
  availableQuantity: 0,
  isUnlimited: false,
  timeToRefill: null,
  dateOfSupplyUtc: null,
  supplyLotId: null,
  keepSellingAfterExpiration: false,
  transfer: null,
  leadTime: "00:00:00",
  previousWarehouseId: "",
  marketplaceId: 0 as MARKETPLACES,
  status: 0 as PostStatus,
  id: "",
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

export enum MARKETPLACES {
  WECODE = 1,
}