import { Ad } from './Ad';
import { connection } from "./server";
import { AdContext, AdsRotationInfo, MARKETPLACES, SkuFileInfo, SkuInventoryInfo } from "./types/types";






const ROTATION_ADS = 3;


export async function run() {



    //HACK: cant think of anything else so this will do for now
    //HACK: platforms are the things that the websites that we are going to put ads on  
    const platforms = [
        MARKETPLACES.TESTING, MARKETPLACES.WECODE
    ];

    await connection('ads_rotation').where('id', '>', 0).del();


    const promiseMatrix = await Promise.allSettled(
        platforms.map(async (platform) => {
            console.log(`fetching ads for platform ${platform}`);
            return await connection.raw(`
      select * , products.id as productId, ads.id as id   from ads inner  join interactions on ads.id = interactions.id inner join sku on ads.skuId = sku.id inner join products on sku.productId = products.id 
        `) as AdContext[][];
        }
        )
    );

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
    const images: SkuFileInfo[] = [];

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
    Object.values(adsMarketplace).forEach(ads => {
        const currentAds: Ad[] = [];
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



            instance.scoring
                .add(instance.context.ctr * 100);

            instance.scoring.calculate();


            instance.scoring.score *= instance.context.canGetInRotation ? 1 : 0.0;



            currentAds.push(instance);

        });

        currentAds.sort((a, b) => b.score - a.score);

        currentAds.forEach((ad, index) => {
            rotaionInfo.push({
                id: ad.context.id,
                inRotation: index < ROTATION_ADS && ad.score > 0,
                canGetInRotation: ad.context.canGetInRotation || false,
                score: ad.score || 0
            });
        });
    });
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
}