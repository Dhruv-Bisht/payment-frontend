export interface Sample {
  name: string;
  labels: Record<string, string>;
  value: number;
}

const LINE = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+(\S+)(?:\s+\d+)?$/;
const LABEL = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;

/** Parses the Prometheus text exposition format served by /actuator/prometheus. */
export function parsePrometheus(text: string): Sample[] {
  const samples: Sample[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = LINE.exec(line);
    if (!m) continue;
    const value = Number(m[3]);
    if (Number.isNaN(value)) continue;
    const labels: Record<string, string> = {};
    if (m[2]) for (const l of m[2].matchAll(LABEL)) labels[l[1]] = l[2];
    samples.push({ name: m[1], labels, value });
  }
  return samples;
}

/** Sum of every sample with this name, optionally restricted to samples carrying the given labels. */
export function total(samples: Sample[], name: string, match: Record<string, string> = {}): number {
  return samples
    .filter((s) => s.name === name && Object.entries(match).every(([k, v]) => s.labels[k] === v))
    .reduce((sum, s) => sum + s.value, 0);
}

export const has = (samples: Sample[], name: string) => samples.some((s) => s.name === name);
