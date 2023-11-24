import { SERVER_URL } from "./constants";

export class BackendApi {
  headers: Headers;
  constructor() {
    this.headers = new Headers();
    this.headers.set('Content-Type', 'application/json');
    this.headers.set('marketplaceId', '1');
  }
  async post<T>(url: string, data: object): Promise<T | undefined> {
    const a = await fetch(`${SERVER_URL}${url}`, {
      headers: this.headers,
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
        headers: this.headers,
        method: "PUT",
        body: JSON.stringify(item),
      });
      if (data.ok) {
        return await data.json();
      }
      return;
    } catch (err) {
      undefined;
    }
    return;
  }
  async get(url: string) {

    const newUrl = `${SERVER_URL}${url}`;

    try {
      const data = await fetch(newUrl, {
        headers: this.headers,
      });
      if (data.ok) {
        return await data.json();
      }
      return;
    } catch (err) {
      undefined;
    }
    return;

  }
}
