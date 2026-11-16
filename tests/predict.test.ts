import { expect, test } from "vitest";
import { comparePrediction } from "../src/game/predict";

test("an exact prediction passes", () => {
  expect(comparePrediction("25\n40", "25\n40\n").passed).toBe(true);
});

test("trailing spaces and trailing blank lines don't count", () => {
  expect(comparePrediction("25  \n40\n\n\n", "25\n40\n").passed).toBe(true);
});

test("blank lines in the middle do count", () => {
  const result = comparePrediction("a\nb", "a\n\nb\n");
  expect(result.passed).toBe(false);
  expect(result.expectedCount).toBe(3);
  expect(result.predictedCount).toBe(2);
});

test("capitals and leading spaces count", () => {
  expect(comparePrediction("Warm", "warm\n").passed).toBe(false);
  expect(comparePrediction("x", "  x\n").passed).toBe(false);
});

test("reports which lines match", () => {
  const result = comparePrediction("warm\nfan off\nno alarm", "warm\nfan on\nno alarm\n");
  expect(result.lines.map((l) => l.matches)).toEqual([true, false, true]);
  expect(result.matched).toBe(2);
});

test("marks missing lines when the prediction is short", () => {
  const result = comparePrediction("one", "one\ntwo\n");
  expect(result.lines).toEqual([
    { predicted: "one", matches: true },
    { predicted: null, matches: false },
  ]);
  expect(result.passed).toBe(false);
});

test("extra predicted lines fail", () => {
  expect(comparePrediction("one\ntwo", "one\n").passed).toBe(false);
});

test("a program with no output can't be passed by an empty prediction", () => {
  expect(comparePrediction("", "").passed).toBe(false);
});
