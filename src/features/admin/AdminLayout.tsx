import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <>
      <h1>Admin console</h1>
      <nav className="subnav" aria-label="Admin sections">
        <NavLink to="/admin" end>Overview</NavLink>
        <NavLink to="/admin/wallets">Wallets</NavLink>
        <NavLink to="/admin/transactions">Transactions</NavLink>
        <NavLink to="/admin/pipeline">Event pipeline</NavLink>
      </nav>
      <Outlet />
    </>
  );
}
