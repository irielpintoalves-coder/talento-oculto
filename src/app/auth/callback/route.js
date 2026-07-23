import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/interview';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
              // Ignora se chamado de Server Component sem middleware ativo
            }
          },
        },
      }
    );

    // Realiza a troca do código OAuth por uma sessão válida
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Erro na troca do código de sessão:', exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Busca os dados do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.redirect(`${origin}/login?error=user_not_found`);
    }

    // Validação da Whitelist consultando a tabela 'users' (ignorando maiúsculas/minúsculas)
const { data: allowedUser } = await supabase
  .from('users')
  .select('email, active')
  .eq('email', user.email)
  .maybeSingle();

    if (dbError || !allowedUser || !allowedUser.active) {
      // Encerra a sessão imediatamente se o e-mail não estiver na tabela
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=unauthorized`);
    }

    // Redireciona com sucesso para a página protegida
    return NextResponse.redirect(`${origin}${next}`);

  } catch (err) {
    console.error('Erro crítico na rota de callback:', err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}