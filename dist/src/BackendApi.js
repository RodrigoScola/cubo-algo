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
exports.BackendApi = void 0;
const constants_1 = require("./constants");
class BackendApi {
    post(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const a = yield fetch(`${constants_1.SERVER_URL}${url}`, {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            });
            if (a.ok) {
                return a.json();
            }
            return;
        });
    }
    update(url, item) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUrl = `${constants_1.SERVER_URL}${url}`;
            try {
                const data = yield fetch(newUrl, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "PUT",
                    body: JSON.stringify(item),
                });
                if (data.ok) {
                    return yield data.json();
                }
                return;
            }
            catch (err) { }
            return;
        });
    }
    get() { }
}
exports.BackendApi = BackendApi;
