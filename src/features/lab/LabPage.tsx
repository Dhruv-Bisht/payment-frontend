import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button } from '../../components/ui';
import { SCENARIOS } from './scenarios';
import type { LogLine, Scenario } from './scenarios';

function ScenarioCard({ scenario, onDone }: { scenario: Scenario; onDone: () => void }) {
  const [state, setState] = useState<{ running: boolean; ran: boolean; log: LogLine[] }>({
    running: false,
    ran: false,
    log: [],
  });

  async function run() {
    setState({ running: true, ran: false, log: [] });
    try {
      setState({ running: false, ran: true, log: await scenario.run() });
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Unexpected error';
      setState({ running: false, ran: true, log: [{ tone: 'bad', text }] });
    } finally {
      onDone();
    }
  }

  const failed = state.log.some((l) => l.tone === 'bad');

  return (
    <section className="scenario" aria-labelledby={`${scenario.id}-h`}>
      <div className="scenario-head">
        <h2 id={`${scenario.id}-h`}>{scenario.title}</h2>
        {state.ran && (failed ? <Badge tone="bad">Needs attention</Badge> : <Badge tone="ok">Verified</Badge>)}
      </div>
      <p className="muted">{scenario.proves}</p>
      <div className="scenario-run">
        <Button variant="secondary" loading={state.running} onClick={run}>
          {state.ran ? 'Run again' : 'Run'}
        </Button>
        {scenario.addsMoney && <span className="muted small">Adds test money to your wallet.</span>}
      </div>
      {state.log.length > 0 && (
        <ol className="log" aria-live="polite">
          {state.log.map((l, i) => (
            <li key={i} className={l.tone}>
              <span className="sr-only">{l.tone === 'ok' ? 'Passed: ' : l.tone === 'bad' ? 'Failed: ' : ''}</span>
              {l.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function LabPage() {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
  };

  return (
    <>
      <h1>Reliability lab</h1>
      <p className="muted lede">
        Run the platform’s guarantees live, against your own wallet. Each scenario makes real API calls and checks the
        outcome. Scenarios that add test money use simulated funds, so your balance and ledger will show them.
      </p>
      <div className="scenarios">
        {SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} onDone={refresh} />
        ))}
      </div>
    </>
  );
}
