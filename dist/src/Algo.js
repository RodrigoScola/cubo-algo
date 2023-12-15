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
exports.run = void 0;
const Ad_1 = require("./Ad");
const server_1 = require("./server");
const types_1 = require("./types/types");
const ROTATION_ADS = 3;
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        //HACK: cant think of anything else so this will do for now
        //HACK: platforms are the things that the websites that we are going to put ads on  
        const platforms = [
            types_1.MARKETPLACES.TESTING
        ];
        yield (0, server_1.connection)('ads_rotation').where('id', '>', 0).del();
        const promiseMatrix = yield Promise.allSettled(platforms.map((platform) => __awaiter(this, void 0, void 0, function* () {
            console.log(`fetching ads for platform ${platform}`);
            const query = server_1.connection.raw(`
      select  * , products.id as productId, ads.id as id   from ads inner  join interactions on ads.id = interactions.id inner join sku on ads.skuId = sku.id inner join products on sku.productId = products.id  where ads.marketplaceId = ${platform} order by ads.id desc
        `);
            console.log(query.toQuery());
            return yield query;
        })));
        const skuIds = [];
        const adsMarketplace = {};
        promiseMatrix.forEach(promise => {
            if (promise.status === 'rejected' || !Array.isArray(promise.value))
                return;
            promise.value.forEach(ads => {
                if (!Array.isArray(ads))
                    return;
                ads.forEach(ad => {
                    if (!ad || !('id' in ad))
                        return;
                    if ('skuId' in ad && skuIds.indexOf(ad.skuId) === -1) {
                        skuIds.push(ad.skuId);
                    }
                    if (!(ad.marketplaceId in adsMarketplace)) {
                        adsMarketplace[ad.marketplaceId] = [ad];
                    }
                    else {
                        adsMarketplace[ad.marketplaceId].push(ad);
                    }
                });
            });
        });
        const [inventoryPromise, imagePromise] = yield Promise.allSettled([
            (0, server_1.connection)('sku_inventory').select('*').whereIn('skuId', skuIds),
            (0, server_1.connection)('sku_file').select('*').whereIn('skuId', skuIds),
        ]);
        const inventory = [];
        const images = [];
        if (inventoryPromise.status === 'fulfilled') {
            inventoryPromise.value.forEach(inventoryItem => {
                inventory.push(inventoryItem);
            });
        }
        if (imagePromise.status === 'fulfilled') {
            imagePromise.value.forEach(skuFile => {
                images.push(skuFile);
            });
        }
        const rotaionInfo = [];
        Object.values(adsMarketplace).forEach((ads) => __awaiter(this, void 0, void 0, function* () {
            let currentAds = [];
            if (!ads)
                return;
            ads.forEach(currentAd => {
                if (!('skuId' in currentAd))
                    return;
                const currentInventories = inventory.filter(inventoryItem => inventoryItem.skuId === currentAd.skuId);
                const currentImages = images.filter(image => image.skuId === currentAd.skuId);
                let isUnlimited = false;
                let total = 0;
                currentInventories.forEach(inventoryItem => {
                    total += inventoryItem.availableQuantity;
                    isUnlimited = isUnlimited || inventoryItem.isUnlimited;
                });
                const canGetInRotation = total > 0;
                const instance = new Ad_1.Ad(Object.assign(Object.assign({}, currentAd), { canGetInRotation, inventory: {
                        total,
                        isUnlimited,
                        hasInventory: total > 0,
                        inventories: currentInventories
                    }, images: currentImages }));
                instance.scoring
                    .add(instance.context.ctr * 100);
                instance.scoring.calculate();
                instance.scoring.score *= instance.context.canGetInRotation ? 1 : 0.0;
                currentAds.push(instance);
            });
            currentAds = currentAds.sort((a, b) => b.score - a.score);
            let allIndex = 0;
            const nads = [];
            currentAds.forEach((ad) => {
                const canGetInRotation = ad.context.canGetInRotation && ad.score > 0 && allIndex < ROTATION_ADS;
                console.log({
                    id: ad.context.id,
                    score: ad.score,
                    can: ad.context.canGetInRotation,
                    should: canGetInRotation
                });
                if (canGetInRotation) {
                    nads.push(ad);
                    allIndex++;
                }
                rotaionInfo.push({
                    id: ad.context.id,
                    inRotation: canGetInRotation,
                    canGetInRotation: ad.context.canGetInRotation || false,
                    score: ad.score || 0
                });
            });
            try {
                console.log('running the rotation');
                yield Promise.allSettled(rotaionInfo.map((rotation) => __awaiter(this, void 0, void 0, function* () {
                    return yield (0, server_1.connection)('ads_rotation').insert(rotation);
                })));
            }
            catch (err) {
                console.log(err);
            }
        }));
    });
}
exports.run = run;
