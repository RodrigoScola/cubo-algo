import { AdInfoObject, InteractionInfoObject, PriceInfo, ProductInfoObject, SkuFile, SkuInfoObject, SkuInventoryInfo } from 'wecubedigital';

export enum CMS_PLATFORMS {
    VTEX = 1,
}


export const AdContextObject = {
    ...AdInfoObject,
    ...ProductInfoObject,
    ...InteractionInfoObject,
    skuId: 0,
    ...SkuInfoObject,
};

export const AdsRotationObject = {
    id: 0,
    inRotation: true,
    canGetInRotation: true,
    score: 0,
};

export type AdsRotationInfo = typeof AdsRotationObject;

export type AdContext = typeof AdContextObject;

export type AdInstanceInfo = AdContext & {
    canGetInRotation: boolean,
    inventory: {
        total: number;
        isUnlimited: boolean,
        hasInventory: boolean;
        inventories: SkuInventoryInfo[];
    };
    prices?: PriceInfo[];
    images: SkuFile[];
};




