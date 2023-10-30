import { SERVER_URL } from "./constants";

export class BackendApi {
  post() {}
  async update<T>(url: string, item: T): Promise<{ data: T } | undefined> {
    const newUrl = `${SERVER_URL}${url}`;

    console.log(`🚀 ~ file: BackendApi.ts:9 ~ BackendApi ~ update ~ newUrl:`, newUrl);

    const data = await fetch(newUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
      body: JSON.stringify(item),
    });
    if (data.ok) {
      return await data.json();
    }
    return;
  }
  get() {}
}
