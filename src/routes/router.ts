import { Router } from "express";
import { MARKETPLACES, SkuFile, SkuInventoryInfo } from 'wecubedigital';
import { Ad } from "../Ad";
import { run } from "../Algo";
import { BadRequestError } from "../ErrorHandler";
import { __DEV__ } from "../constants";
import { connection } from "../server";
import { AdContext, } from "../types/types";

export const appRouter = Router();






appRouter.use('/', (req, _, next) => {



    if (__DEV__ && !('marketplaceid' in req.headers)) {
        req.headers.marketplaceid = MARKETPLACES.WECODE;
    }

    if (!('marketplaceid' in req.headers) || !req.headers.marketplaceid) {
        throw new BadRequestError("Missing marketplaceId");
    }

    req.marketplace = req.headers.marketplaceid as MARKETPLACES;



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
    const [ads] = await connection.raw(`
select * from ads 
inner join ads_rotation on ads.id = ads_rotation.id 
inner join sku on ads.skuId = sku.id 
inner join products on sku.productId = products.id 
inner join interactions on ads.id = interactions.id 
where ads.marketplaceId = "${req.marketplace}" and ads_rotation.canGetInRotation = 1
    `) as [AdContext[]];
    if (!ads || !Array.isArray(ads)) return res.json([]);



    const skuIds: number[] = [];
    ads.forEach((ad: AdContext) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1) return;
        skuIds.push(ad.skuId);
    });

    const images: SkuFile[] = [];
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
    const [ads] = await connection.raw(`
select * from ads inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on sku.productId = products.id inner join interactions on ads.id = interactions.id where ads.marketplaceId = ${req.marketplace} and ads_rotation.inRotation = 1 order by ads.score desc
    `) as [AdContext[]];
    if (!ads || !Array.isArray(ads)) return res.json([]);

    const skuIds: number[] = [];
    ads.forEach((ad: AdContext) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1) return;
        skuIds.push(ad.skuId);
    });


    const images: SkuFile[] = [];
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