import { Link } from 'react-router-dom';
import { StatusChip } from '../../components/ui';
import { useHealth } from '../system/useHealth';
import { Explainer } from './Explainer';

export default function LandingPage() {
  const health = useHealth();

  return (
    <div className="landing">
      <header className="pub-head">
        <p className="brand">Payment Platform</p>
        <Link className="link" to="/login">Sign in</Link>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-h">
          <div className="hero-copy">
            <h1 id="hero-h">Money that moves once, and adds up every time.</h1>
            <p className="lede">
              A wallet platform built the way payment systems are: a retry can’t charge you twice, simultaneous
              payments can’t lose money, and every movement is recorded as a debit and a credit that sum to zero.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/register">Create an account</Link>
              <Link className="btn btn-secondary" to="/login">Sign in</Link>
            </div>
            <p className="small status">
              <StatusChip state={health.data} /> <span className="muted">Live status of the service behind this page.</span>
            </p>
          </div>

          <figure className="hero-entry">
            <figcaption className="muted small">An example payment, as the ledger records it</figcaption>
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col" className="num">Debit</th>
                  <th scope="col" className="num">Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Asha’s wallet</td>
                  <td className="num debit">₹1,200.00</td>
                  <td className="num"></td>
                </tr>
                <tr>
                  <td>Ravi’s wallet</td>
                  <td className="num"></td>
                  <td className="num credit">₹1,200.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Totals <span className="badge badge-ok">Balanced</span></th>
                  <td className="num">₹1,200.00</td>
                  <td className="num">₹1,200.00</td>
                </tr>
              </tfoot>
            </table>
          </figure>
        </section>

        <Explainer signedIn={false} />
      </main>

      <footer className="pub-foot muted small">
        Payment Platform. A portfolio project demonstrating payment-system engineering.
      </footer>
    </div>
  );
}
