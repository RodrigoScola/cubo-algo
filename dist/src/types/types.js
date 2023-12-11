"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsRotationObject = exports.AdContextObject = exports.AdInteractionInfoObject = exports.SkuFileObject = exports.AdInfoObject = exports.SkuInventoryInfoObject = exports.MarketplaceObj = exports.SkuInfoObject = exports.ProductInfoObject = exports.ItemStatus = exports.MARKETPLACES = exports.CMS_PLATFORMS = void 0;
var CMS_PLATFORMS;
(function (CMS_PLATFORMS) {
    CMS_PLATFORMS[CMS_PLATFORMS["VTEX"] = 1] = "VTEX";
})(CMS_PLATFORMS || (exports.CMS_PLATFORMS = CMS_PLATFORMS = {}));
var MARKETPLACES;
(function (MARKETPLACES) {
    MARKETPLACES[MARKETPLACES["WECODE"] = 1] = "WECODE";
    MARKETPLACES[MARKETPLACES["TESTING"] = 2] = "TESTING";
})(MARKETPLACES || (exports.MARKETPLACES = MARKETPLACES = {}));
exports.ItemStatus = {
    /**
     * Item vai ser usado para todas as coisas
     *  - algoritmos, sites, dashboards... tudo
     *
     * Todas as pessoas podem ver, mesmo sem permissao
     *
     */
    ACTIVE: 1,
    /**
     * Item nao vai ser usado em nada
     * Algumas pessoas podem ver, tendo a permissao
     *  - devs da wecode
     */
    INACTIVE: 0,
    /**
     * Item pode ser visto no sites/dashboards mas nao sera utilizado no algoritmo,
     */
    PAUSED: 2,
    /**
     * Item esta sendo postado, utilizado para itens que dependem de outros para estarem ativos
     * - ex: marketplace, campanhas
     * normalmente vai virar ativo assim que as criacas completarem de ficarem ativos
     */
    STARTING: 3,
    /**
     * Item esta sendo deletado, utilizado para itens que dependem de outros para estarem ativos
     * - ex: marketplace, campanhas
     * normalmente vai virar inativo assim que as criacas completarem de ficarem inativos
     */
    ENDING: 4,
    /**
     * Item foi blockeado por algum motivo, para nao remover da database, porque temos que ter a informacao,
     * para tomar as medidas necessarias. so devemos mudar a flag dele
     * vai ser tratado como item inativo
     */
    BLOCKED: 5,
};
exports.ProductInfoObject = {
    name: "Mesa 2 Gav Az-2007 Branco/nogal teste de update",
    departmentId: 114,
    categoryId: 116,
    brandId: 2000007,
    linkId: "Mesa-2-Gav-Az-2007-Branco-nogal-teste-de-update",
    RefId: "123",
    isVisible: 1,
    description: "7447486798798754541<br/><br/><strong>espec 1:</strong> cor novinha<br/><br/><strong>123456:</strong> 654321<br/><br/>",
    descriptionShort: "7447486798798754541",
    keyWords: "",
    marketplaceId: MARKETPLACES.TESTING,
    title: "",
    taxCode: "",
    metaTagDescription: "74b47486798798754541<br/><br/><strong>espec 1:</strong> cor ovinhabr/><br/><strong>123456:</strong> 654321<br/><br/>",
    supplierId: null,
    showWithoutStock: 0,
    adWordsRemarketingCode: null,
    lomadeeCampaignCode: null,
    score: null,
    status: 1,
    previousId: 0,
    releaseDate: "2022-10-26T00:00:00.000Z",
    id: 0,
};
exports.SkuInfoObject = {
    isPersisted: false,
    productId: 0,
    marketplaceId: MARKETPLACES.TESTING,
    estimatedDateArrival: Date.now(),
    previousId: 0,
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
    isKitOptimized: 0,
    id: 0,
};
exports.MarketplaceObj = {
    name: "wecode",
    platformId: 1,
    id: 9,
    status: 0,
};
exports.SkuInventoryInfoObject = {
    id: "41.123",
    skuId: 41,
    warehouseId: "ewaoma1",
    warehouseName: "Estoque principal",
    totalQuantity: 1000001,
    reservedQuantity: 1,
    hasUnlimitedQuantity: 1,
    availableQuantity: 2,
    timeToRefill: null,
    leadTime: "00:00:00",
    dateOfSupplyUtc: null,
    status: 1,
    isUnlimited: true,
    previousSkuId: 2,
    supplyLotId: "3",
    marketplaceId: MARKETPLACES.TESTING,
    keepSellingAfterExpiration: true,
    transfer: true,
    previousWarehouseId: "2.1_1",
};
exports.AdInfoObject = {
    marketplaceId: MARKETPLACES.TESTING,
    skuId: 0,
    campaignId: 0,
    productId: 3,
    adType: "",
    id: 1,
    score: 1,
    status: 2,
};
exports.SkuFileObject = {
    id: 0,
    archiveId: 0,
    previousId: 0,
    marketplaceId: MARKETPLACES.TESTING,
    skuId: 0,
    name: "",
    isMain: 0,
    url: "",
    label: "",
};
exports.AdInteractionInfoObject = {
    clicks: 0,
    views: 0,
    ctr: 0,
    id: 0,
};
exports.AdContextObject = Object.assign(Object.assign(Object.assign(Object.assign({}, exports.AdInfoObject), exports.ProductInfoObject), exports.AdInteractionInfoObject), exports.SkuInfoObject);
exports.AdsRotationObject = {
    id: 0,
    inRotation: true,
    canGetInRotation: true,
    score: 0,
};
