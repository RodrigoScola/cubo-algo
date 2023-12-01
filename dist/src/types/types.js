"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARKETPLACES = exports.SkuFileObject = exports.NewSkuFileObject = exports.UpdatingSkuInventoryObject = exports.SkuInventoryInfoObject = exports.NewSkuInventoryObject = exports.SkuInfoObject = exports.NewSkuInfoObject = exports.ProductInfoObject = exports.NewProductInfoObject = exports.UpdatingAdInfoObject = exports.MarketplaceObj = exports.InteractionObject = exports.NewInteractionObject = exports.AdInfoObject = exports.NewAdInfoObject = exports.PostStatus = void 0;
exports.PostStatus = {
    ACTIVE: 1,
    INACTIVE: 0,
};
exports.NewAdInfoObject = {
    marketplaceId: 3,
    skuId: 0,
    price: 300,
    productId: 3,
    adType: "",
    status: 0,
};
exports.AdInfoObject = Object.assign(Object.assign({}, exports.NewAdInfoObject), { score: 9, status: 0, skuId: 0, id: 0 });
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
    status: 0,
    score: 0,
};
exports.ProductInfoObject = Object.assign(Object.assign({}, exports.NewProductInfoObject), { id: 0 });
exports.NewSkuInfoObject = {
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
exports.SkuInfoObject = Object.assign(Object.assign({}, exports.NewSkuInfoObject), { id: 0 });
exports.NewSkuInventoryObject = {
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
    marketplaceId: 0,
    status: 0,
    id: "",
};
exports.SkuInventoryInfoObject = Object.assign({}, exports.NewSkuInventoryObject);
exports.UpdatingSkuInventoryObject = {
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
    marketplaceId: 0,
    status: 0,
    id: "",
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
var MARKETPLACES;
(function (MARKETPLACES) {
    MARKETPLACES[MARKETPLACES["WECODE"] = 1] = "WECODE";
})(MARKETPLACES || (exports.MARKETPLACES = MARKETPLACES = {}));
