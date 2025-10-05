import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Prevent open redirects
  const nextPath = next.startsWith('/') ? next : '/dashboard';

  console.log('[Callback] Code:', code ? 'present' : 'missing');

  if (!code) {
    console.log('[Callback] No code, redirecting to login');
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error('[Callback] Exchange error:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`);
  }

  const user = data.user;
  console.log('[Callback] User authenticated:', user.id);

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Student';

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    // Profile exists - only update non-role fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        name,
        avatar: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Callback] Profile update error:', updateError);
    } else {
      console.log('[Callback] Profile updated (role preserved)');
    }
  } else {
    // Profile doesn't exist - create new one with default student role
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name,
        role: 'student', // Default role for new users
        avatar: user.user_metadata?.avatar_url || null,
      });

    if (insertError) {
      console.error('[Callback] Profile insert error:', insertError);
    } else {
      console.log('[Callback] Profile created');
    }
  }

  console.log('[Callback] Redirecting to:', nextPath);
  return NextResponse.redirect(`${requestUrl.origin}${nextPath}`);
}
