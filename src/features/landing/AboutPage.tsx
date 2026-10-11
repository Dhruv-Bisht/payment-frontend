import { Explainer } from './Explainer';
import { useMe } from '../wallet/queries';

/** The same explainer as the public home page, with live links into the app. */
export default function AboutPage() {
  const me = useMe();
  return (
    <>
      <h1>How it works</h1>
      <p className="lede muted">
        What happens to a payment, which guarantees the platform makes, and where in this app you can watch each one.
      </p>
      <Explainer signedIn isAdmin={me.data?.role === 'ADMIN'} />
    </>
  );
}
