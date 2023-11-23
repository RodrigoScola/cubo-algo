import { Marketplace } from "./src/marketplace";

// to make the file a module and avoid the TypeScript error
export { };

declare global {
  namespace Express {
    export interface Request {
      marketplace?: Marketplace;
      ad?: AdInstance;
    }
  }
}
