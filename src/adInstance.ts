import { AdHandler } from "./Adhandler";
import { connection } from "./server";
import { AdContext, AdInfo } from "./types/types";

class Scoring {
  private numbers: number[];
  private _score: number;

  private readonly baseScore;
  constructor(initialScore: number) {
    this.numbers = [initialScore];
    this._score = initialScore;
    this.baseScore = initialScore;
  }
  get score() {
    return this._score;
  }
  add(num: number | undefined) {
    if (!num) return;
    this.numbers.push(num);
  }
  set(num: number) {
    this._score = num;
  }
  calculate() {
    this._score = 0;

    this.numbers.forEach((number) => {
      this._score += number;
    });
    this.numbers = [];
    return this.score;
  }
  reset() {
    this.numbers = [];
    this._score = this.baseScore;
  }
}
export class AdInstance {
  info: AdInfo;
  context?: AdContext | undefined;
  scoring: Scoring;
  type: "product" | "banner";
  inRotation: boolean;

  constructor(info: AdInfo) {
    this.type = "product";
    this.info = info;
    this.scoring = new Scoring(0);
    this.inRotation = false;
  }
  get canGetRotation() {
    return this.context?.inventory.hasInventory;
  }

  get score() {
    return this.scoring.score || 0;
  }
  addScore(num: number) {
    this.scoring.add(num);
  }

  async getContext() {
    if (this.context) return this.context;
    if (this.info.skuId === 0) {
      const skuId = await AdHandler.getBestSku(this.info);

      if (!skuId) return;

      await connection.update({ skuId }).where({ id: this.info.id }).from("ads");

      this.info.skuId = skuId;
    }

    console.log('getting context');
    const context = await AdHandler.getContext(this.info);

    this.scoring.set(context?.ctr ?? 0);

    this.context = {
      ...context,
      score: this.score,
    } as AdContext;

    return this.context;
  }
  calculateScore(): number {
    this.scoring.calculate();
    return this.scoring.score;
  }
}