import { isSupabaseConfigured } from '../../lib/supabase';

export function DatabaseConfigGuard({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Database Not Configured</h1>
        <p className="text-gray-600 mb-4">
          This app now uses Supabase for authentication and data storage. Follow the setup steps in{' '}
          <code className="bg-gray-100 px-1 rounded">DATABASE_SETUP.md</code>, then create a{' '}
          <code className="bg-gray-100 px-1 rounded">.env</code> file from{' '}
          <code className="bg-gray-100 px-1 rounded">.env.example</code>.
        </p>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 mb-4">
          <li>Create a Supabase project at supabase.com</li>
          <li>Run the SQL migration in <code className="bg-gray-100 px-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
          <li>Copy API URL and anon key into <code className="bg-gray-100 px-1 rounded">.env</code></li>
          <li>Restart the dev server</li>
        </ol>
        <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
        </pre>
      </div>
    </div>
  );
}
