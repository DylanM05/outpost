import type { Confidence, ConfidenceRecord } from "./save";

export const CONFIDENCE_LEVELS = ["unsure", "likely", "certain"] as const;

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  unsure: "Unsure",
  likely: "Fairly sure",
  certain: "Certain",
};

export interface CalibrationBucket {
  level: Confidence;
  label: string;
  total: number;
  passed: number;
  rate: number | null;
}

export interface CalibrationReport {
  total: number;
  buckets: CalibrationBucket[];
  note: string | null;
}

export function isConfidence(value: unknown): value is Confidence {
  return value === "unsure" || value === "likely" || value === "certain";
}

// Summarizes how often submissions passed for each optional pre-submit
// confidence rating. Designed purely as private self-calibration, never a grade.
export function calibrationSummary(records: readonly ConfidenceRecord[]): CalibrationReport {
  const buckets: CalibrationBucket[] = CONFIDENCE_LEVELS.map((level) => {
    const matching = records.filter((r) => r.confidence === level);
    const passed = matching.filter((r) => r.passed).length;
    return {
      level,
      label: CONFIDENCE_LABEL[level],
      total: matching.length,
      passed,
      rate: matching.length > 0 ? passed / matching.length : null,
    };
  });

  const certain = buckets.find((b) => b.level === "certain")!;
  const unsure = buckets.find((b) => b.level === "unsure")!;

  let note: string | null = null;
  if (certain.total >= 3 && certain.rate !== null && certain.rate < 0.7) {
    note = `When you felt Certain, checks passed ${certain.passed} of ${certain.total} times. Tracing one extra edge case before submitting can close that gap.`;
  } else if (unsure.total >= 3 && unsure.rate !== null && unsure.rate >= 0.7) {
    note = `When you felt Unsure, your work still passed ${unsure.passed} of ${unsure.total} times. Your instincts are stronger than they feel.`;
  } else if (records.length >= 5) {
    note = "Your confidence ratings track your actual results well. Keep using them whenever you want a quick reality check.";
  }

  return { total: records.length, buckets, note };
}
