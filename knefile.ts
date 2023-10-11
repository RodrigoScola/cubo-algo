import { AdInfo, InventoryInfo, ProductInfo, SkuFile, SkuInfo } from "./src/types/types";

declare module "knex/types/tables" {
  interface Tables {
    products: ProductInfo;
    sku: SkuInfo;
    sku_inventory: InventoryInfo;
    ads: AdInfo;
    sku_file: SkuFile;
  }
}
