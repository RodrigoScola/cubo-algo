import { AdInstance } from "../adInstance";

export class ViewLogType {
  log(arg: AdInstance) {
    console.log(arg);
  }
}

export const LogTypes = {
  view: ViewLogType,
};
export function isLogType(type: string): type is keyof typeof LogTypes {
  return !!LogTypes[type as keyof typeof LogTypes];
}
class LogFactory {
  getLog(type: keyof typeof LogTypes) {
    return new LogTypes[type]();
  }
}
export const logFactory = new LogFactory();
