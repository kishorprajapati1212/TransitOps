import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center dark:bg-slate-950">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient text-white shadow-sm">
        <Icon name="map" className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">This page took a wrong turn at the depot.</p>
      <Link to="/" className="mt-6">
        <Button><Icon name="home" className="h-4 w-4" /> Back to home</Button>
      </Link>
    </div>
  );
}
