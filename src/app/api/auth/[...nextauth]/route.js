import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[NextAuth Warning] Supabase URL ou Service Role Key ausentes no .env.local");
    return null;
  }
  return createClient(url, key);
};

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user || !user.email) return false;

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          // Se Supabase ainda não estiver configurado localmente, permite login no ambiente de desenvolvimento
          if (process.env.NODE_ENV === "development") {
            console.warn("[NextAuth Dev] Permitindo login local sem verificação de Whitelist.");
            return true;
          }
          return "/unauthorized";
        }

        // Consulta a tabela 'users' no Supabase
const { data, error } = await supabase
  .from("allowed_emails")  // ✅ CORRETO!
  .select("email")
  .ilike("email", user.email)
  .maybeSingle();

        if (error) {
          console.error("[NextAuth Supabase Error]:", error.message);
          return "/unauthorized";
        }

        if (!data || !data.is_active) {
          return "/unauthorized";
        }

        return true;
      } catch (err) {
        console.error("[NextAuth Exception]:", err);
        return "/unauthorized";
      }
    },
    async session({ session }) {
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