export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Restrito</h1>
        <p className="text-slate-600 mb-6">
          O seu e-mail não está cadastrado na whitelist do <strong>Talento Oculto</strong> ou seu acesso está desativado.
        </p>
        <a
          href="/"
          className="inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Voltar para a Página Inicial
        </a>
      </div>
    </div>
  );
}