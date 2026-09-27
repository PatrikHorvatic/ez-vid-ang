import { EvaTimeDisplayPipe } from "./time-display-pipe";

const EIGHTY_THREE_SECONDS = 83;
const ONE_HOUR_TWO_MIN_THREE_SEC = 3723;
const FRACTIONAL_SECONDS_REMAINING = 0.2;
const FRACTIONAL_SECOND = 0.9;
const NEGATIVE_SECONDS = -5;

describe("TimeDisplayPipe", () => {
  let pipe: EvaTimeDisplayPipe;

  beforeEach(() => {
    pipe = new EvaTimeDisplayPipe();
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("formats mm:ss for current time", () => {
    expect(pipe.transform(EIGHTY_THREE_SECONDS, "mm:ss", "current")).toBe("01:23");
  });

  it("formats HH:mm:ss for total duration", () => {
    expect(pipe.transform(ONE_HOUR_TWO_MIN_THREE_SEC, "HH:mm:ss", "total")).toBe("01:02:03");
  });

  it("renders 00:00 instead of NaN:NaN when the value is not a finite number", () => {
    expect(pipe.transform(NaN, "mm:ss", "current")).toBe("00:00");
    expect(pipe.transform(Infinity, "mm:ss", "remaining")).toBe("00:00");
  });

  it("ceiling-rounds remaining time so it doesn't prematurely show zero", () => {
    // 0.2s left should still read as 1 second remaining, not 0.
    expect(pipe.transform(FRACTIONAL_SECONDS_REMAINING, "ss", "remaining")).toBe("1");
  });

  it("floor-rounds current/total time instead of ceiling", () => {
    expect(pipe.transform(FRACTIONAL_SECOND, "ss", "current")).toBe("0");
    expect(pipe.transform(FRACTIONAL_SECOND, "ss", "total")).toBe("0");
  });

  it("clamps negative values to 0", () => {
    expect(pipe.transform(NEGATIVE_SECONDS, "mm:ss", "current")).toBe("00:00");
  });
});
