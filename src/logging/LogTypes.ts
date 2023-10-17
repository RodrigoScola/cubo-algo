import { SETTINGS_FLAGS } from "../Algo";
import { AdInstance } from "../marketplace";

export class ViewLogType {
  private viewWeight: number;

  constructor(viewWeight: number) {
    this.viewWeight = viewWeight;
  }
  log(arg: AdInstance) {
    arg.addScore(this.viewWeight);
    arg.properties.views++;
    console.log(arg.context?.title, "was viewed by a user.");
  }
}

export const LogTypes = {
  view: ViewLogType,
};
class LogFactory {
  getLog(type: keyof typeof LogTypes) {
    return new LogTypes[type](SETTINGS_FLAGS.viewWeight);
  }
}
export const logFactory = new LogFactory();
