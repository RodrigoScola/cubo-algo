import { MARKETPLACES } from "wecubedigital";
import { SERVER_URL } from "../constants";

export class BackendApi {
    headers: Headers;
    private readonly marketplaceId: MARKETPLACES;
    constructor(props: {
        marketplaceId: MARKETPLACES;
        access_token: string;
    }) {
        this.marketplaceId = props.marketplaceId;

        this.headers = new Headers();
        this.headers.set("Authorization", `Bearer ${props.access_token}`);
        this.headers.set("Content-Type", "application/json");
        this.headers.set("marketplaceId", this.marketplaceId.toString());

    }
    postData<T extends object>(url: string, data: T): Promise<Response> {
        return fetch(`${SERVER_URL}${url}`, {
            headers: this.headers,
            body: JSON.stringify(data),
            method: "POST",
        });
    }

    async getData<T>(url: string,): Promise<T | undefined> {

        const data = await fetch(`${SERVER_URL}${url}`, {
            headers: this.headers,
        });



        if (data.ok) {
            return data.json();
        }
        return;
    }
    updateData<T extends object>(url: string, data: T): Promise<Response> {
        return fetch(`${SERVER_URL}${url}`, {
            headers: this.headers,
            body: JSON.stringify(data),
            method: "PUT",
        });
    }
}
