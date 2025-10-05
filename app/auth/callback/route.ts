import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/dashboard';
  const nextPath = next.startsWith('/') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login', url), 303);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    console.error('[Callback] exchange error:', error?.message);
    return NextResponse.redirect(new URL('/login?error=auth', url), 303);
  }

  const user = data.user;
  const name =
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Student';

  // Atomic profile write. Ensure RLS allows auth users to upsert their own row.
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        name,
        // preserve role if present by not overwriting when row exists
        role: 'student',
        avatar: user.user_metadata?.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false } // standard PG upsert
    )
    .select('id')          // enforces RLS and returns minimal data
    .single();             // ok because row will exist after upsert

  if (profileErr) {
    console.error('[Callback] profile upsert error:', profileErr.message);
    // don't block login; proceed to app
  }

  return NextResponse.redirect(new URL(nextPath, url), 303);
}
