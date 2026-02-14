import { redirect } from 'next/navigation';

// The root page just redirects to the dashboard.
// The middleware will handle redirecting to /login if not authenticated.
export default function Home() {
  redirect('/dashboard');
}
