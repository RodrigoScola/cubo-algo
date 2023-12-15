import { Router } from "express";
import { Ad } from "../Ad";
import { run } from "../Algo";
import { BadRequestError } from "../ErrorHandler";
import { __DEV__ } from "../constants";
import { connection } from "../server";
import { AdContext, MARKETPLACES, SkuFileInfo, SkuInventoryInfo } from "../types/types";

export const appRouter = Router();



const CURRENTMARKETPLACEID = __DEV__ ? 2 : 1;


appRouter.use('/', (req, _, next) => {
    if (!('marketplaceid' in req.headers)) {
        req.headers.marketplaceid = String(CURRENTMARKETPLACEID);
    }

    if (__DEV__) {
        req.headers.marketplaceid = '2';
    }

    if (!('marketplaceid' in req.headers)) {
        throw new BadRequestError("Missing marketplaceId");
    }
    const marketplaceId = Number(req.headers.marketplaceid);


    if (!marketplaceId) {
        throw new BadRequestError("Invalid MarketplaceId");
    }

    req.marketplace = marketplaceId;
    next();
});


appRouter.use('/ads/run', async (_, res, __) => {
    console.log("Running algo");



    clearMarketplace();


    try {

        await run();
        res.json({ success: true });
    }
    catch (err) {
        res.json({ success: false });
    }

});
appRouter.use('/ads/reset', async (_, res, __) => {
    console.log("resetting algo");

    try {
        await Promise.all([
            connection('ads').where('id', '>', 0).del(),
            connection('ads_rotation').where('id', '>', 0).del(),
            connection('interactions').where('id', '>', 0).del(),
            connection('campaigns').where('id', '>', 0).del()
        ]);
        clearMarketplace();
        res.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        });
    }
});

appRouter.use('/ads/populate', async (_, res, __) => {



    res.json({ success: true });

});

const MarketplaceAds: Map<MARKETPLACES, Ad[]> = new Map();


export function clearMarketplace() {
    MarketplaceAds.clear();

}

appRouter.get("/testing/ads", async (req, res) => {
    console.log(`getting ads for marketplace ${req.marketplace}`);

    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace));
    }
    const [ads] = await connection.raw(`
select *,  sku.id as skuId, ads.id as id  from ads inner join interactions on ads.id = interactions.id inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id where ads.marketplaceId = ${Number(req.headers.marketplaceid)}  order by ads_rotation.score desc
    `) as [AdContext[]];
    if (!ads || !Array.isArray(ads)) return res.json([]);



    const skuIds: number[] = [];
    ads.forEach((ad: AdContext) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1) return;
        skuIds.push(ad.skuId);
    });


    const images: SkuFileInfo[] = [];
    const inventories: SkuInventoryInfo[] = [];
    const prices: any[] = [];
    const [inventoriesPromise, imagePromise, pricePromise] = await Promise.allSettled([
        connection('sku_inventory').select('*').whereIn('skuId', skuIds),
        connection('sku_file').select('*').whereIn('skuId', skuIds),
        connection('prices').select('*').whereIn('skuId', skuIds),

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



    const allAds: Ad[] = [];

    ads.forEach(ad => {
        if (!ad) return;
        const image = images.filter(image => image.skuId === ad.skuId);
        const currentInventories = inventories.filter(image => image.skuId === ad.skuId);
        const price = prices.filter(image => image.skuId === ad.skuId);
        const totalInventory = currentInventories.reduce((a, b) => a + b.availableQuantity, 0);


        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad({
            ...ad,
            images: image ? image : [],
            prices: price,
            inventory: {
                total: totalInventory,
                isUnlimited: currentInventories.some(a => a.isUnlimited),
                hasInventory: totalInventory > 0,
                inventories: currentInventories
            },
        }));
    });

    MarketplaceAds.set(req.marketplace, allAds);

    return res.json(allAds);
});

appRouter.get("/ads", async (req, res) => {
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace)?.map(ad => ad.info));
    }
    const [ads] = await connection.raw(`
select *,  sku.id as skuId, ads.id as id  from ads inner join interactions on ads.id = interactions.id inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id order by ads_rotation.score desc
    `) as [AdContext[]];
    if (!ads || !Array.isArray(ads)) return res.json([]);

    const skuIds: number[] = [];
    ads.forEach((ad: AdContext) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1) return;
        skuIds.push(ad.skuId);
    });


    const images: SkuFileInfo[] = [];
    const inventories: SkuInventoryInfo[] = [];
    const prices: any[] = [];
    const [inventoriesPromise, imagePromise, pricePromise] = await Promise.allSettled([
        connection('sku_inventory').select('*').whereIn('skuId', skuIds),
        connection('sku_file').select('*').whereIn('skuId', skuIds),
        connection('prices').select('*').whereIn('skuId', skuIds),

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



    const allAds: Ad[] = [];

    ads.forEach(ad => {
        if (!ad) return;
        const image = images.filter(image => image.skuId === ad.skuId);
        const currentInventories = inventories.filter(image => image.skuId === ad.skuId);
        const price = prices.filter(image => image.skuId === ad.skuId);
        const totalInventory = currentInventories.reduce((a, b) => a + b.availableQuantity, 0);


        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad({
            ...ad,
            images: image ? image : [],
            prices: price,
            inventory: {
                total: totalInventory,
                isUnlimited: currentInventories.some(a => a.isUnlimited),
                hasInventory: totalInventory > 0,
                inventories: currentInventories
            },
        }));
    });

    MarketplaceAds.set(req.marketplace, allAds);

    return res.json(allAds.map(ad => ad.info));
});