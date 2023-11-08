import { SERVER_URL } from "./constants";

export class BackendApi {
  async post<T>(url: string, data: object): Promise<T | undefined> {
    const a = await fetch(`${SERVER_URL}${url}`, {
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
  }
  async update<T>(url: string, item: T): Promise<T | undefined> {
    const newUrl = `${SERVER_URL}${url}`;

    try {
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
    } catch (err) {}
  }
  get() {}
}
