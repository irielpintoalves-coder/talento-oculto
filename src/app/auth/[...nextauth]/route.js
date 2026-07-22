import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Inicializa o cliente do Supabase com privilégios administrativos para checar a whitelist
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user || !user.email) return false;

      // Consulta a tabela 'users' no Supabase
      const { data, error } = await supabase
        .from("users")
        .select("is_active")
        .eq("email", user.email)
        .single();

      // Se houver erro ou o usuário não estiver ativo, bloqueia o acesso redirecionando para unauthorized
      if (error || !data || !data.is_active) {
        return "/unauthorized";
      }

      return true;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/unauthorized",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };