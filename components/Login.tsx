import React, { useState } from 'react';
import { authClient } from '../services/auth';

interface LoginProps {
  onEntrou: () => void;
  cadastroInicial: boolean;
}

type Etapa = 'entrar' | 'cadastro' | 'codigo' | 'esqueci';

const Login: React.FC<LoginProps> = ({ onEntrou, cadastroInicial }) => {
  const [etapa, setEtapa] = useState<Etapa>(cadastroInicial ? 'cadastro' : 'entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ir = (e: Etapa) => { setEtapa(e); setErro(null); setAviso(null); };

  // O cliente do Neon às vezes devolve { error } e às vezes lança (ex.: 401): trata os dois.
  const tentar = async (acao: () => Promise<{ error?: { message?: string; code?: string } | null } | void>) => {
    setEnviando(true);
    setErro(null);
    try {
      const r = await acao();
      if (r && r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
    } catch (err) {
      const e = err as Error & { code?: string };
      // Conta existe mas o e-mail não foi confirmado: manda um código novo e pede para digitar.
      if (e.code === 'EMAIL_NOT_VERIFIED' || /not verified/i.test(e.message)) {
        await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' }).catch(() => {});
        ir('codigo');
        setAviso(`Confirme seu e-mail: enviamos um código para ${email}.`);
      } else {
        setErro(traduz(e.message));
      }
    } finally {
      setEnviando(false);
    }
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (etapa === 'entrar') return tentar(async () => {
      const r = await authClient.signIn.email({ email, password: senha });
      if (!r.error) onEntrou();
      return r;
    });
    if (etapa === 'cadastro') return tentar(async () => {
      const r = await authClient.signUp.email({ name: nome || email.split('@')[0], email, password: senha });
      if (r.error) return r;
      // Com a confirmação de e-mail ligada no Neon, o cadastro não abre sessão: pede o código.
      const { data } = await authClient.getSession();
      if (data?.session) return onEntrou();
      ir('codigo');
      setAviso(`Enviamos um código de confirmação para ${email}.`);
    });
    if (etapa === 'codigo') return tentar(async () => {
      const r = await authClient.emailOtp.verifyEmail({ email, otp: codigo.trim() });
      if (r.error) return r;
      // Com login automático após confirmar, já há sessão; senão, entra com a senha digitada.
      const { data } = await authClient.getSession();
      if (!data?.session && senha) await authClient.signIn.email({ email, password: senha });
      onEntrou();
    });
    return tentar(async () => {
      const r = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/redefinir-senha` });
      if (r.error) return r;
      setAviso('Se existir uma conta com este e-mail, enviamos um link para criar uma senha nova. Ele vale por 15 minutos.');
    });
  };

  const reenviarCodigo = () =>
    tentar(async () => {
      await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      setAviso(`Código reenviado para ${email}.`);
    });

  const google = () =>
    authClient.signIn.social({ provider: 'google', callbackURL: window.location.href })
      .catch(err => setErro(traduz((err as Error).message)));

  const campo = 'w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const link = 'text-indigo-600 font-semibold hover:underline';

  const titulo = { entrar: 'Entre na sua conta', cadastro: 'Crie sua conta', codigo: 'Confirme seu e-mail', esqueci: 'Esqueci minha senha' }[etapa];
  const subtitulo = {
    entrar: 'Bom te ver de novo.',
    cadastro: 'Ganhe 3 gerações grátis para testar.',
    codigo: 'Digite o código de 6 dígitos que chegou no seu e-mail.',
    esqueci: 'Informe seu e-mail e enviamos um link para criar uma senha nova.',
  }[etapa];
  const botao = { entrar: 'Entrar', cadastro: 'Criar conta', codigo: 'Confirmar', esqueci: 'Enviar link' }[etapa];

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{titulo}</h2>
      <p className="text-gray-600 text-center mb-6">{subtitulo}</p>

      {(etapa === 'entrar' || etapa === 'cadastro') && (
        <>
          <button onClick={google} className="w-full border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4">
            Continuar com Google
          </button>
          <div className="flex items-center gap-3 text-gray-400 text-sm mb-4">
            <span className="flex-1 border-t" />ou<span className="flex-1 border-t" />
          </div>
        </>
      )}

      <form onSubmit={enviar} className="space-y-3">
        {etapa === 'cadastro' && <input className={campo} placeholder="Nome da loja ou seu nome" value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" />}
        {etapa !== 'codigo' && (
          <input className={campo} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        )}
        {(etapa === 'entrar' || etapa === 'cadastro') && (
          <input className={campo} type="password" placeholder="Senha (mínimo 8 caracteres)" value={senha} onChange={e => setSenha(e.target.value)} required minLength={8} autoComplete={etapa === 'cadastro' ? 'new-password' : 'current-password'} />
        )}
        {etapa === 'codigo' && (
          <input className={`${campo} text-center text-2xl tracking-widest`} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={codigo} onChange={e => setCodigo(e.target.value)} required maxLength={6} />
        )}
        {etapa === 'cadastro' && (
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} required className="mt-1" />
            <span>Li e aceito os <a href="/termos" target="_blank" className={link}>Termos de Uso</a> e a <a href="/privacidade" target="_blank" className={link}>Política de Privacidade</a>.</span>
          </label>
        )}
        {etapa === 'entrar' && (
          <button type="button" onClick={() => ir('esqueci')} className="text-sm text-indigo-600 hover:underline">Esqueci minha senha</button>
        )}
        {aviso && <p className="text-green-700 text-sm bg-green-50 rounded p-2" role="status">{aviso}</p>}
        {erro && <p className="text-red-600 text-sm" role="alert">{erro}</p>}
        <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {enviando ? 'Aguarde…' : botao}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        {etapa === 'codigo' ? (
          <>Não chegou? Veja o spam ou <button onClick={reenviarCodigo} className={link}>reenviar código</button></>
        ) : etapa === 'esqueci' ? (
          <button onClick={() => ir('entrar')} className={link}>Voltar para o login</button>
        ) : (
          <>
            {etapa === 'cadastro' ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <button onClick={() => ir(etapa === 'cadastro' ? 'entrar' : 'cadastro')} className={link}>
              {etapa === 'cadastro' ? 'Entrar' : 'Criar conta'}
            </button>
          </>
        )}
      </p>
    </div>
  );
};

export const traduz = (msg = '') =>
  /already exists/i.test(msg) ? 'Já existe uma conta com este e-mail. Tente entrar.'
  : /invalid (email or password|password|credentials)/i.test(msg) ? 'E-mail ou senha incorretos.'
  : /password.*short/i.test(msg) ? 'A senha precisa ter pelo menos 8 caracteres.'
  : /invalid otp|otp.*(invalid|expired)|too many attempts/i.test(msg) ? 'Código inválido ou vencido. Peça um novo.'
  : /invalid token|token.*expired/i.test(msg) ? 'Este link venceu ou já foi usado. Peça um novo em "Esqueci minha senha".'
  : msg || 'Não foi possível concluir. Tente novamente.';

export default Login;
