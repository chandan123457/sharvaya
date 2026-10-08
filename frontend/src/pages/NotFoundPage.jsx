import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-28 text-center">
      <p className="font-mono text-[12px] text-stone-400">404</p>
      <h1 className="mt-3 font-display text-[44px] leading-none text-stone-900">
        Nothing <em>here</em>
      </h1>
      <p className="mt-3 text-[14px] text-stone-500">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/candidates" className="btn-primary mt-7">
        Back to candidates
      </Link>
    </div>
  );
}
