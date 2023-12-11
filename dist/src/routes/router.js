"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMarketplace = exports.appRouter = void 0;
const express_1 = require("express");
const Ad_1 = require("../Ad");
const ErrorHandler_1 = require("../ErrorHandler");
const constants_1 = require("../constants");
const server_1 = require("../server");
exports.appRouter = (0, express_1.Router)();
exports.appRouter.use('/', (req, _, next) => {
    if (constants_1.__DEV__) {
        req.headers.marketplaceid = '2';
    }
    if (!('marketplaceid' in req.headers)) {
        throw new ErrorHandler_1.BadRequestError("Missing marketplaceId");
    }
    const marketplaceId = Number(req.headers.marketplaceid);
    if (!marketplaceId) {
        throw new ErrorHandler_1.BadRequestError("Invalid MarketplaceId");
    }
    req.marketplace = marketplaceId;
    next();
});
const MarketplaceAds = new Map();
function clearMarketplace() {
    MarketplaceAds.clear();
}
exports.clearMarketplace = clearMarketplace;
exports.appRouter.get("/testing/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace));
    }
    const [ads] = yield server_1.connection.raw(`
select *,  sku.id as skuId, ads.id as id  from ads inner join interactions on ads.id = interactions.id inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id order by ads_rotation.score desc
    `);
    if (!ads || !Array.isArray(ads))
        return res.json([]);
    const skuIds = [];
    ads.forEach((ad) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1)
            return;
        skuIds.push(ad.skuId);
    });
    const images = [];
    const inventories = [];
    const prices = [];
    const [inventoriesPromise, imagePromise, pricePromise] = yield Promise.allSettled([
        (0, server_1.connection)('sku_inventory').select('*').whereIn('skuId', skuIds),
        (0, server_1.connection)('sku_file').select('*').whereIn('skuId', skuIds),
        (0, server_1.connection)('prices').select('*').whereIn('skuId', skuIds),
    ]);
    if (imagePromise.status === 'fulfilled') {
        imagePromise.value.forEach(imageItem => {
            images.push(imageItem);
        });
    }
    if (pricePromise.status === 'fulfilled') {
        pricePromise.value.forEach(imageItem => {
            prices.push(imageItem);
        });
    }
    if (inventoriesPromise.status === 'fulfilled') {
        inventoriesPromise.value.forEach(inventory => {
            inventories.push(inventory);
        });
    }
    const allAds = [];
    ads.forEach(ad => {
        if (!ad)
            return;
        const image = images.filter(image => image.skuId === ad.skuId);
        const currentInventories = inventories.filter(image => image.skuId === ad.skuId);
        const price = prices.filter(image => image.skuId === ad.skuId);
        const totalInventory = currentInventories.reduce((a, b) => a + b.availableQuantity, 0);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad_1.Ad(Object.assign(Object.assign({}, ad), { images: image ? image : [], prices: price, inventory: {
                total: totalInventory,
                isUnlimited: currentInventories.some(a => a.isUnlimited),
                hasInventory: totalInventory > 0,
                inventories: currentInventories
            } })));
    });
    return res.json(allAds);
}));
exports.appRouter.get("/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get images, get products
    var _a;
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json((_a = MarketplaceAds.get(req.marketplace)) === null || _a === void 0 ? void 0 : _a.map(item => item.info));
    }
    const [ads] = yield server_1.connection.raw(`
select *, products.id as productId, ads.id as id from ads inner join ads_rotation on ads.id = ads_rotation.id  inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id where ads_rotation.inRotation = 1 order by ads_rotation.score desc
    `);
    const skuIds = [];
    ads.forEach(ad => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']))
            return;
        skuIds.push(ad.skuId);
    });
    const images = [];
    const prices = [];
    const [imagePromise, pricePromise] = yield Promise.allSettled([
        (0, server_1.connection)('sku_file').select('*').whereIn('skuId', skuIds),
        (0, server_1.connection)('prices').select('*').whereIn('skuId', skuIds),
    ]);
    if (imagePromise.status === 'fulfilled') {
        imagePromise.value.forEach(imageItem => {
            images.push(imageItem);
        });
    }
    if (pricePromise.status === 'fulfilled') {
        pricePromise.value.forEach(imageItem => {
            prices.push(imageItem);
        });
    }
    console.log({ pricePromise });
    const allAds = [];
    console.log(prices, 'prices');
    ads.forEach(ad => {
        const image = images.filter(image => image.skuId === ad.skuId);
        const currentPrices = prices.filter(image => image.skuId === ad.skuId);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad_1.Ad(Object.assign(Object.assign({}, ad), { prices: currentPrices, images: image ? image : [] })));
    });
    MarketplaceAds.set(req.marketplace, allAds);
    return res.json(allAds.map(item => item.info));
}));
