import { has, parsePrometheus, total } from './prometheus';

const SAMPLE = `# HELP outbox_pending_events Outbox rows waiting to be published
# TYPE outbox_pending_events gauge
outbox_pending_events 3.0
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",id="G1 Eden Space"} 1048576.0
jvm_memory_used_bytes{area="heap",id="G1 Old Gen"} 2097152.0
jvm_memory_used_bytes{area="nonheap",id="Metaspace"} 500.0
ledger_imbalance_detected_total 0.0
`;

describe('prometheus parser', () => {
  const samples = parsePrometheus(SAMPLE);

  it('skips comments and parses plain and labelled samples', () => {
    expect(samples).toHaveLength(5);
    expect(total(samples, 'outbox_pending_events')).toBe(3);
  });

  it('sums across label sets and can filter by label', () => {
    expect(total(samples, 'jvm_memory_used_bytes', { area: 'heap' })).toBe(3145728);
    expect(total(samples, 'jvm_memory_used_bytes', { area: 'nonheap' })).toBe(500);
  });

  it('knows whether a metric is present', () => {
    expect(has(samples, 'ledger_imbalance_detected_total')).toBe(true);
    expect(has(samples, 'nope')).toBe(false);
  });
});
