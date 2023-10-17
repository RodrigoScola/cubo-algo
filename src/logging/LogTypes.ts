export class ViewLogType {
  log(arg: any) {
    console.log(arg);
  }
}

export const LogTypes = {
  view: ViewLogType,
};
class LogFactory {
  getLog(type: keyof typeof LogTypes) {
    return new LogTypes[type]();
  }
}
export const logFactory = new LogFactory();
