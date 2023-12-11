
export class Scoring {
    score: number;
    private numbers: number[];
    constructor() {
        this.numbers = [];
        this.score = 0;
    }
    add(num: number) {
        this.numbers.push(num);
        return this;
    }
    calculate() {
        this.score = this.numbers.reduce((acc, val) => acc + val, 0) * 100;
    }
}