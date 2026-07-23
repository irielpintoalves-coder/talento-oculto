import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/interview';

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
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
              // Ignora em chamadas de Server Components
            }
          },
        },
      }
    );

    // 1. Troca o código OAuth pela sessão do usuário
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Erro na troca de código:', exchangeError.message);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    // 2. Pega as informações do e-mail retornado pelo Google
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.redirect(`${origin}/?error=user_not_found`);
    }

    // -------------------------------------------------------------
    // 3. VERIFICAÇÃO DE HIERARQUIA E PERMISSÕES
    // -------------------------------------------------------------

    // NÍVEL 1: É USUÁRIO MASTER (Super Admin)?
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .ilike('email', user.email)
      .maybeSingle();

    if (profile?.role === 'master') {
      // Se for o primeiro acesso do Master, vincula o id da conta Google ao perfil
      if (!profile.id) {
        await supabase
          .from('profiles')
          .update({ id: user.id })
          .ilike('email', user.email);
      }

      console.log(`[Acesso Concedido] Usuário Master: ${user.email}`);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // -------------------------------------------------------------
    // SEM PERMISSÃO DE ACESSO
    // -------------------------------------------------------------
    console.warn(`[Acesso Negado] O e-mail ${user.email} não possui licença ativa ou perfil Master/Admin.`);
    
    // Desloga o usuário
    await supabase.auth.signOut();
    
    return NextResponse.redirect(`${origin}/?error=unauthorized`);

  } catch (err) {
    console.error('Erro crítico no callback:', err);
    return NextResponse.redirect(`${origin}/?error=server_error`);
  }
}