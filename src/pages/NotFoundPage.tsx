import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container-app py-16 text-center">
      <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mt-2">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-6">
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
