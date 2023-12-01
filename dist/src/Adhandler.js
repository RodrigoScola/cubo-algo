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
exports.AdHandler = void 0;
const BackendApi_1 = require("./BackendApi");
const server_1 = require("./server");
class AdHandler {
    getContext(adInfo) {
        return AdHandler.getContext(adInfo);
    }
    static getAdsContext(info) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(info.map((ad) => {
                ad.context = undefined;
                return ad.getContext();
            }));
        });
    }
    static getContext(adInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const itemPromise = (0, server_1.connection)("ads")
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
            const imagesPromise = new BackendApi_1.BackendApi().get(`/sku/${adInfo.skuId}/file`);
            const inventoryPromise = new BackendApi_1.BackendApi().get(`/sku/${adInfo.skuId}/inventory`);
            const [item, images, inventory] = yield Promise.all([itemPromise, imagesPromise, inventoryPromise]);
            if (!item)
                return;
            item.images = images;
            if (inventory) {
                const totalInventory = inventory.reduce((acc, item) => acc += item.availableQuantity, 0);
                item.inventory = {
                    total: totalInventory,
                    hasInventory: totalInventory > 0,
                    inventory
                };
            }
            return item;
        });
    }
    static getBestSku(ad) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const [skus] = yield server_1.connection.raw(`
    select sum(si.totalQuantity) as totalQuantity, si.skuId, s.productId from sku_inventory as si left join sku as s on si.skuId = s.id where s.productId = ${ad.productId} group by skuId  order by totalQuantity desc
    `);
            return (_b = (_a = skus.find((x) => x)) === null || _a === void 0 ? void 0 : _a.skuId) !== null && _b !== void 0 ? _b : null;
        });
    }
}
exports.AdHandler = AdHandler;
