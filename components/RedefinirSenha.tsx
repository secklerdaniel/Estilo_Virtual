import React, { useState } from 'react';
import { authClient } from '../services/auth';
import { traduz } from './Login';

// Destino do link de "Esqueci minha senha": /redefinir-senha?token=...
const RedefinirSenha: React.FC<{ onPronto: () => void }> = ({ onPronto }) => {
  const token = new URLSearchParams(window.location.search).get('token');
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirma) return setErro('As senhas não são iguais.');
    setEnviando(true);
    setErro(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: senha, token: token! });
      if (error) throw new Error(error.message);
      onPronto();
    } catch (err) {
      setErro(traduz((err as Error).message));
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Criar senha nova</h2>
      {!token || token === 'INVALID_TOKEN' ? (
        <p className="text-red-600 text-center">Este link é inválido ou venceu. Peça um novo em "Esqueci minha senha".</p>
      ) : (
        <form onSubmit={enviar} className="space-y-3 mt-6">
          <input className={campo} type="password" placeholder="Senha nova (mínimo 8 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} required minLength={8} autoComplete="new-password" />
          <input className={campo} type="password" placeholder="Repita a senha nova" value={confirma} onChange={e => setConfirma(e.target.value)} required minLength={8} autoComplete="new-password" />
          {erro && <p className="text-red-600 text-sm" role="alert">{erro}</p>}
          <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {enviando ? 'Aguarde…' : 'Salvar senha nova'}
          </button>
        </form>
      )}
    </div>
  );
};

export default RedefinirSenha;
