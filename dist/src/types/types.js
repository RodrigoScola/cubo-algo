"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkuFileObject = exports.NewSkuFileObject = exports.UpdatingSkuInventoryObject = exports.SkuInventoryInfoObject = exports.NewSkuInventoryObject = exports.SkuInfoObject = exports.NewSkuInfoObject = exports.ProductInfoObject = exports.NewProductInfoObject = exports.UpdatingAdInfoObject = exports.MarketplaceObj = exports.InteractionObject = exports.NewInteractionObject = exports.AdInfoObject = exports.NewAdInfoObject = void 0;
exports.NewAdInfoObject = {
    marketplaceId: 3,
    price: 300,
    productId: 3,
    adType: "",
};
exports.AdInfoObject = Object.assign(Object.assign({}, exports.NewAdInfoObject), { score: 9, isActive: true, skuId: 0, id: 0 });
exports.NewInteractionObject = {
    clicks: 0,
    views: 0,
    ctr: 0,
};
exports.InteractionObject = Object.assign(Object.assign({}, exports.NewInteractionObject), { id: 0 });
exports.MarketplaceObj = {
    id: 9,
    name: "wecode",
};
exports.UpdatingAdInfoObject = Object.entries(exports.NewAdInfoObject).reduce((accumulator, [key, value]) => {
    if (key === "id") {
        return accumulator;
    }
    if (key) {
        Object.assign(accumulator, { [key]: value });
    }
    return accumulator;
}, {});
exports.NewProductInfoObject = {
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
exports.ProductInfoObject = Object.assign(Object.assign({}, exports.NewProductInfoObject), { id: 0 });
exports.NewSkuInfoObject = {
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
exports.SkuInfoObject = Object.assign(Object.assign({}, exports.NewSkuInfoObject), { id: 0 });
exports.NewSkuInventoryObject = {
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
exports.SkuInventoryInfoObject = Object.assign({ id: 0 }, exports.NewSkuInventoryObject);
exports.UpdatingSkuInventoryObject = {
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
exports.NewSkuFileObject = {
    archiveId: 0,
    skuId: 0,
    name: "",
    isMain: false,
    url: "",
    label: "",
};
exports.SkuFileObject = Object.assign(Object.assign({ id: 0 }, exports.NewSkuFileObject), { skuId: 0 });
