// Compares a typed prediction with a program's real output, line by line.
// Trailing spaces and trailing blank lines are ignored; everything else counts.

export function outputLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export interface PredictedLine {
  // null when the prediction is shorter than the real output
  predicted: string | null;
  matches: boolean;
}

export interface Comparison {
  lines: PredictedLine[];
  matched: number;
  expectedCount: number;
  predictedCount: number;
  passed: boolean;
}

export function comparePrediction(prediction: string, actual: string): Comparison {
  const predicted = outputLines(prediction);
  const expected = outputLines(actual);
  const lines = Array.from({ length: Math.max(predicted.length, expected.length) }, (_, i) => ({
    predicted: predicted[i] ?? null,
    matches: i < predicted.length && i < expected.length && predicted[i] === expected[i],
  }));
  const matched = lines.filter((line) => line.matches).length;
  return {
    lines,
    matched,
    expectedCount: expected.length,
    predictedCount: predicted.length,
    passed: expected.length > 0 && matched === expected.length && predicted.length === expected.length,
  };
}
