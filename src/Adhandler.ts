import { BackendApi } from "./BackendApi";
import { AdInstance } from "./adInstance";
import { connection } from "./server";
import { AdContext, AdInfo, InventoryInfo, NewAdInfo, SkuInfo } from "./types/types";

export class AdHandler {
  getContext(adInfo: AdInfo) {
    return AdHandler.getContext(adInfo);
  }
  static async getAdsContext(info: AdInstance[]): Promise<(AdContext | undefined)[]> {
    return await Promise.all(
      info.map((ad) => {
        ad.context = undefined;
        return ad.getContext();
      })
    );
  }

  static async getContext(adInfo: AdInfo) {
    const itemPromise = connection<AdContext>("ads")
      .select("*")
      .join("sku", function () {
        this.on("ads.skuId", "=", "sku.id");
      })
      .join("interactions", function () {
        this.on("interactions.id", "=", "ads.id");
      })
      .where("ads.id", adInfo.id)
      .andWhere("ads.productId", adInfo.productId)

      .join("products", function () {
        this.on("products.id", "=", "ads.productId");
      })
      .first();

    const imagesPromise = new BackendApi().get(`/sku/${adInfo.skuId}/file`);

    const inventoryPromise = new BackendApi().get(`/sku/${adInfo.skuId}/inventory`);


    const [item, images, inventory] = await Promise.all([itemPromise, imagesPromise, inventoryPromise]);
    if (!item) return;

    item.images = images;

    const totalInventory = inventory.reduce((acc: number, item: InventoryInfo) => acc += item.availableQuantity, 0);


    item.inventory = {
      total: totalInventory,
      hasInventory: totalInventory > 0,
      inventory
    };

    return item;
  }
  static async getBestSku(ad: NewAdInfo | AdInfo): Promise<number | undefined> {
    const [skus] = await connection.raw(`
    select sum(si.totalQuantity) as totalQuantity, si.skuId, s.productId from sku_inventory as si left join sku as s on si.skuId = s.id where s.productId = ${ad.productId} group by skuId  order by totalQuantity desc
    `);

    return skus.find((x: SkuInfo) => x)?.skuId ?? null;
  }
}
