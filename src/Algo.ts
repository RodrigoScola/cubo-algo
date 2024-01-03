import { MARKETPLACES, MarketplaceInfo, SkuFile, SkuInventoryInfo } from 'wecubedigital';
import { Ad } from './Ad';
import { CURRENT_ACCESS_TOKEN, ROTATION_ADS } from './constants';
import { BackendApi } from './lib/BackendApi';
import { connection } from "./server";
import { AdContext, AdsRotationInfo, } from "./types/types";



export async function run() {
    let marketplaceIds: string[] = [];
    try {

        await new BackendApi({
            access_token: CURRENT_ACCESS_TOKEN,
            marketplaceId: MARKETPLACES.WECODE
        }).getData<MarketplaceInfo[]>('/marketplace').then(data => {
            if (!data || !Array.isArray(data)) return;
            data.forEach(marketplace => {
                if ('id' in marketplace && typeof marketplace.id === 'string') {
                    marketplaceIds.push(marketplace.id);
                }
            });
        });
    } catch (err) {
        console.log(err);
    }

    await connection('ads_rotation').where('id', '>', 0).del();

    const promiseMatrix = await Promise.allSettled(
        marketplaceIds.map(async (platform) => {
            const query = connection.raw(`
      select  *, ads.marketplaceId as marketplaceId , products.id as productId, ads.id as id   from ads inner  join interactions on ads.id = interactions.id inner join sku on ads.skuId = sku.id inner join products on sku.productId = products.id  where ads.marketplaceId = "${platform}" order by ads.id desc
        `);
            return await query as AdContext[][];
        }));
    const skuIds: number[] = [];
    const adsMarketplace: Record<MARKETPLACES, AdContext[]> = {
    } as Record<MARKETPLACES, AdContext[]>;

    promiseMatrix.forEach(promise => {
        if (promise.status === 'rejected' || !Array.isArray(promise.value)) return;
        promise.value.forEach(ads => {
            if (!Array.isArray(ads)) return;
            ads.forEach(ad => {
                if (!ad || !('id' in ad)) return;
                if ('skuId' in ad && skuIds.indexOf(ad.skuId) === -1) {
                    skuIds.push(ad.skuId);
                }
                if (!(ad.marketplaceId in adsMarketplace)) {
                    adsMarketplace[ad.marketplaceId] = [ad];
                } else {
                    adsMarketplace[ad.marketplaceId].push(ad);
                }
            });

        });
    });

    const [inventoryPromise, imagePromise] = await Promise.allSettled([
        connection('sku_inventory').select('*').whereIn('skuId', skuIds),
        connection('sku_file').select('*').whereIn('skuId', skuIds),
    ]);

    const inventory: SkuInventoryInfo[] = [];
    const images: SkuFile[] = [];

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
    const rotaionInfo: AdsRotationInfo[] = [];



    Object.values(adsMarketplace).forEach(async (ads) => {
        console.log('this');
        let currentAds: Ad[] = [];
        if (!ads) return;
        ads.forEach(currentAd => {
            if (!('skuId' in currentAd)) return;

            const currentInventories = inventory.filter(inventoryItem => inventoryItem.skuId === currentAd.skuId);

            const currentImages = images.filter(image => image.skuId === currentAd.skuId);

            let isUnlimited = false;
            let total = 0;

            currentInventories.forEach(inventoryItem => {
                total += inventoryItem.availableQuantity;
                isUnlimited = isUnlimited || inventoryItem.isUnlimited;
            });

            const canGetInRotation = total > 0;

            const instance = new Ad({
                ...currentAd,
                canGetInRotation,
                inventory: {
                    total,
                    isUnlimited,
                    hasInventory: total > 0,
                    inventories: currentInventories
                },
                images: currentImages
            });

            instance.scoring.add(total);


            instance.scoring.add(instance.context.ctr * 100);


            instance.scoring.calculate();


            instance.scoring.score *= instance.context.canGetInRotation ? 1 : 0.0;



            currentAds.push(instance);

        });


        currentAds = currentAds.sort((a, b) => b.score - a.score);

        let allIndex = 0;


        const nads = [];


        currentAds.forEach((ad,) => {



            const canGetInRotation = ad.context.canGetInRotation && ad.score > 0 && allIndex < ROTATION_ADS;






            if (canGetInRotation) {
                nads.push(ad);
                allIndex++;
            }


            rotaionInfo.push({
                id: ad.context.id,
                inRotation:
                    canGetInRotation


                ,
                canGetInRotation: ad.context.canGetInRotation || false,
                score: ad.score || 0
            });
        });
        console.log('rotationinfo', rotaionInfo.filter(a => a.inRotation == true).length);

        try {
            console.log('running the rotation');
            await Promise.allSettled(
                rotaionInfo.map(async (rotation) => {
                    return await connection('ads_rotation').insert(rotation);
                }
                ));
        } catch (err) {
            console.log(err);

        }
    });

}