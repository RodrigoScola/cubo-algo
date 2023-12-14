import { AdInfo, AdInteractionInfo, AdsRotationInfo, CampaignInfo, MarketplaceInfo, ProductInfo, SkuFileInfo, SkuInfo, SkuInventoryInfo } from "./src/types/types";

declare module "knex/types/tables" {
  interface Tables {
    products: ProductInfo;
    sku: SkuInfo;
    sku_inventory: SkuInventoryInfo;
    ads: AdInfo;
    sku_file: SkuFileInfo;
    interactions: AdInteractionInfo;
    marketplace: MarketplaceInfo;
    ads_rotation: AdsRotationInfo;
    campaigns: CampaignInfo;
  }
}
