import { connection } from "./server";
import { AdContext, AdInfo, NewAdInfo } from "./types/types";

export class AdHandler {
  getContext(adInfo: AdInfo) {
    return AdHandler.getContext(adInfo);
  }
  static postProduct(info: NewAdInfo) {
    return connection("ads").insert(info).returning("id");
  }
  static async getContext(adInfo: AdInfo) {
    const itemPromise = await connection<AdContext>("ads")
      .select("*")
      .join("sku", function () {
        this.on("ads.skuId", "=", "sku.id");
      })
      .where("ads.id", adInfo.id)
      .andWhere("ads.productId", adInfo.productId)
      .join("products", function () {
        this.on("products.id", "=", "ads.productId");
      })
      .first();

    const imagesPromise = connection("sku_file").select("isMain", "url", "name").where("skuId", adInfo.skuId);

    const [item, images] = await Promise.all([itemPromise, imagesPromise]);

    if (!item) return;

    item.images = images;

    return item;
  }
  static getBestSku(ad: NewAdInfo) {
    return connection.raw(`
    select sum(si.totalQuantity) as totalQuantity, si.skuId, s.productId from sku_inventory as si left join sku as s on si.skuId = s.id where s.productId = ${ad.productId} group by skuId order by totalQuantity desc
    `);
  }
}
