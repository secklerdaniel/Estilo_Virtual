import React, { useState } from 'react';
import { authClient } from '../services/auth';

interface LoginProps {
  onEntrou: () => void;
  cadastroInicial: boolean;
}

const Login: React.FC<LoginProps> = ({ onEntrou, cadastroInicial }) => {
  const [cadastro, setCadastro] = useState(cadastroInicial);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const { error } = cadastro
      ? await authClient.signUp.email({ name: nome || email.split('@')[0], email, password: senha })
      : await authClient.signIn.email({ email, password: senha });
    setEnviando(false);
    if (error) return setErro(traduz(error.message));
    onEntrou();
  };

  const google = () => authClient.signIn.social({ provider: 'google', callbackURL: window.location.href });

  const campo = 'w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        {cadastro ? 'Crie sua conta' : 'Entre na sua conta'}
      </h2>
      <p className="text-gray-600 text-center mb-6">
        {cadastro ? 'Ganhe 3 gerações grátis para testar.' : 'Bom te ver de novo.'}
      </p>

      <button onClick={google} className="w-full border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4">
        Continuar com Google
      </button>
      <div className="flex items-center gap-3 text-gray-400 text-sm mb-4">
        <span className="flex-1 border-t" />ou<span className="flex-1 border-t" />
      </div>

      <form onSubmit={enviar} className="space-y-3">
        {cadastro && <input className={campo} placeholder="Nome da loja ou seu nome" value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" />}
        <input className={campo} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <input className={campo} type="password" placeholder="Senha (mínimo 8 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} required minLength={8} autoComplete={cadastro ? 'new-password' : 'current-password'} />
        {erro && <p className="text-red-600 text-sm" role="alert">{erro}</p>}
        <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {cadastro ? 'Já tem conta? ' : 'Ainda não tem conta? '}
        <button onClick={() => { setCadastro(!cadastro); setErro(null); }} className="text-indigo-600 font-semibold hover:underline">
          {cadastro ? 'Entrar' : 'Criar conta'}
        </button>
      </p>
    </div>
  );
};

const traduz = (msg = '') =>
  /already exists/i.test(msg) ? 'Já existe uma conta com este e-mail. Tente entrar.'
  : /invalid (email or password|password|credentials)/i.test(msg) ? 'E-mail ou senha incorretos.'
  : /password.*short/i.test(msg) ? 'A senha precisa ter pelo menos 8 caracteres.'
  : msg || 'Não foi possível entrar. Tente novamente.';

export default Login;
