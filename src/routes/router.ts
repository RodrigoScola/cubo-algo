import { Router } from "express";
import { Ad } from "../Ad";
import { BadRequestError } from "../ErrorHandler";
import { __DEV__ } from "../constants";
import { connection } from "../server";
import { AdContext, MARKETPLACES, SkuFileInfo, SkuInventoryInfo } from "../types/types";

export const appRouter = Router();





appRouter.use('/', (req, _, next) => {

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


const MarketplaceAds: Map<MARKETPLACES, Ad[]> = new Map();



appRouter.get("/testing/ads", async (req, res) => {
    console.log('string', req.marketplace);
    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace));
    }
    const [ads] = await connection.raw(`
select *,  sku.id as skuId, ads.id as id  from ads inner join ads_rotation on ads.id = ads_rotation.id inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id order by ads_rotation.score desc
    `) as [AdContext[]];
    console.log(ads, 'this are the ads');
    if (!ads || !Array.isArray(ads)) return res.json([]);

    const skuIds: number[] = [];
    ads.forEach((ad: AdContext) => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId']) === -1) return;
        skuIds.push(ad.skuId);
    });

    console.log(ads, 'the ads');

    const images: SkuFileInfo[] = [];
    const inventories: SkuInventoryInfo[] = [];
    const [inventoriesPromise, imagePromise] = await Promise.allSettled([
        connection('sku_inventory').select('*').whereIn('skuId', skuIds),
        connection('sku_file').select('*').whereIn('skuId', skuIds),
    ]);
    if (imagePromise.status === 'fulfilled') {
        imagePromise.value.forEach(imageItem => {
            images.push(imageItem);
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

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad({
            ...ad,
            images: image ? image : [],
        }));
    });

    return res.json(allAds);
});

appRouter.get("/ads", async (req, res) => {
    // get images, get products

    if (MarketplaceAds.has(req.marketplace)) {
        return res.json(MarketplaceAds.get(req.marketplace)?.map(item => item.info));
    }

    const [ads] = await connection.raw(`
select products.id as productId,* from ads inner join ads_rotation on ads.id = ads_rotation.id  inner join sku on ads.skuId = sku.id inner join products on ads.productId = products.id
    `) as [AdContext[]];
    console.log(ads, 'this are the ads');
    const skuIds: number[] = [];
    ads.forEach(ad => {
        if (!('skuId' in ad) && skuIds.indexOf(ad['skuId'])) return;
        skuIds.push(ad.skuId);
    });

    const images: SkuFileInfo[] = [];
    const [, imagePromise] = await Promise.allSettled([
        connection('sku_inventory').select('*').whereIn('skuId', skuIds),
        connection('sku_file').select('*').whereIn('skuId', skuIds),
    ]);
    if (imagePromise.status === 'fulfilled') {
        imagePromise.value.forEach(imageItem => {
            images.push(imageItem);
        });
    }



    const allAds: Ad[] = [];



    ads.forEach(ad => {
        const image = images.filter(image => image.skuId === ad.skuId);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        allAds.push(new Ad({
            ...ad,
            images: image ? image : [],
        } as AdContext));
    });
    MarketplaceAds.set(req.marketplace, allAds);
    return res.json(allAds.map(item => item.info));
});