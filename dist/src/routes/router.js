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
const Algo_1 = require("../Algo");
const ErrorHandler_1 = require("../ErrorHandler");
const constants_1 = require("../constants");
const server_1 = require("../server");
exports.appRouter = (0, express_1.Router)();
const CURRENTMARKETPLACEID = constants_1.__DEV__ ? 2 : 1;
exports.appRouter.use('/', (req, _, next) => {
    if (!('marketplaceid' in req.headers)) {
        req.headers.marketplaceid = String(CURRENTMARKETPLACEID);
    }
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
exports.appRouter.use('/ads/run', (_, res, __) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running algo");
    clearMarketplace();
    try {
        yield (0, Algo_1.run)();
        res.json({ success: true });
    }
    catch (err) {
        res.json({ success: false });
    }
}));
exports.appRouter.use('/ads/reset', (_, res, __) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("resetting algo");
    try {
        yield Promise.all([
            (0, server_1.connection)('ads').where('id', '>', 0).del(),
            (0, server_1.connection)('ads_rotation').where('id', '>', 0).del(),
            (0, server_1.connection)('interactions').where('id', '>', 0).del(),
            (0, server_1.connection)('campaigns').where('id', '>', 0).del()
        ]);
        clearMarketplace();
        res.json({
            success: true
        });
    }
    catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
}));
exports.appRouter.use('/ads/populate', (_, res, __) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ success: true });
}));
const MarketplaceAds = new Map();
function clearMarketplace() {
    MarketplaceAds.clear();
}
exports.clearMarketplace = clearMarketplace;
exports.appRouter.get("/testing/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`getting ads for marketplace ${req.marketplace}`);
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace));
    }
    const [ads] = yield server_1.connection.raw(`
select *,  sku.id as skuId, ads.id as id  from ads inner join interactions on ads.id = interactions.id inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id where ads.marketplaceId = ${Number(req.headers.marketplaceid)}  order by ads_rotation.score desc
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
    MarketplaceAds.set(req.marketplace, allAds);
    return res.json(allAds);
}));
exports.appRouter.get("/ads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json((_a = MarketplaceAds.get(req.marketplace)) === null || _a === void 0 ? void 0 : _a.map(ad => ad.info));
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
    MarketplaceAds.set(req.marketplace, allAds);
    return res.json(allAds.map(ad => ad.info));
}));
