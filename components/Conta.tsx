import React, { useEffect, useState } from 'react';
import { api, authClient, Conta as ContaT, Imagem, Loja } from '../services/auth';
import { traduz } from './Login';

interface ContaProps {
  conta: ContaT | null;
  imagens: Imagem[];
  onMudou: () => void;
  onVerPlanos: () => void;
  onExcluida: () => void;
}

const NOME_PLANO = { gratis: 'Grátis', essencial: 'Essencial', profissional: 'Profissional', ilimitado: 'Ilimitado' };

const campo = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const botao = 'bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60';
const botaoSec = 'bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-60';

/** Estado de envio + mensagem de um formulário, para não repetir em cada seção. */
function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const enviar = async (acao: () => Promise<string | void>) => {
    setEnviando(true);
    setMsg(null);
    try {
      const texto = await acao();
      if (texto) setMsg({ ok: true, texto });
    } catch (e) {
      setMsg({ ok: false, texto: traduz((e as Error).message) });
    } finally {
      setEnviando(false);
    }
  };
  const Mensagem = () => (msg ? <p className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`} role="status">{msg.texto}</p> : null);
  return { enviando, enviar, Mensagem };
}

const Secao: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="bg-white rounded-xl shadow p-6 space-y-4">
    <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
    {children}
  </section>
);

const Perfil: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const perfil = useEnvio();
  const senha = useEnvio();

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      setNome(data?.user?.name ?? '');
      setEmail(data?.user?.email ?? '');
    });
  }, []);

  return (
    <Secao titulo="Perfil">
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); perfil.enviar(async () => {
        const { error } = await authClient.updateUser({ name: nome.trim() });
        if (error) throw new Error(error.message);
        return 'Nome salvo.';
      }); }}>
        <label className="block text-sm text-gray-600">Nome
          <input className={campo} value={nome} onChange={e => setNome(e.target.value)} required maxLength={80} />
        </label>
        <label className="block text-sm text-gray-600">E-mail
          <input className={`${campo} bg-gray-50`} value={email} disabled />
        </label>
        <perfil.Mensagem />
        <button className={botao} disabled={perfil.enviando}>{perfil.enviando ? 'Salvando…' : 'Salvar nome'}</button>
      </form>

      <form className="space-y-3 pt-4 border-t" onSubmit={e => { e.preventDefault(); senha.enviar(async () => {
        const { error } = await authClient.changePassword({ currentPassword: atual, newPassword: nova, revokeOtherSessions: true });
        if (error) throw new Error(error.message);
        setAtual(''); setNova('');
        return 'Senha trocada. Os outros aparelhos foram desconectados.';
      }); }}>
        <h3 className="font-semibold text-gray-800">Trocar senha</h3>
        <input className={campo} type="password" placeholder="Senha atual" value={atual} onChange={e => setAtual(e.target.value)} required autoComplete="current-password" />
        <input className={campo} type="password" placeholder="Senha nova (mínimo 8 caracteres)" value={nova} onChange={e => setNova(e.target.value)} required minLength={8} autoComplete="new-password" />
        <senha.Mensagem />
        <button className={botaoSec} disabled={senha.enviando}>{senha.enviando ? 'Trocando…' : 'Trocar senha'}</button>
      </form>
    </Secao>
  );
};

const Plano: React.FC<{ conta: ContaT | null; onVerPlanos: () => void }> = ({ conta, onVerPlanos }) => {
  const portal = useEnvio();
  if (!conta) return null;
  return (
    <Secao titulo="Plano e créditos">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Plano</p>
          <p className="text-2xl font-bold text-indigo-700">{NOME_PLANO[conta.plano]}</p>
          {conta.status !== 'ativa' && <p className="text-sm text-red-600">{conta.status === 'inadimplente' ? 'Pagamento pendente' : 'Cancelada'}</p>}
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Créditos</p>
          <p className="text-2xl font-bold text-indigo-700">{conta.restantes} <span className="text-base font-normal text-gray-500">de {conta.limite}</span></p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">{conta.assinante ? 'Renova em' : 'Validade'}</p>
          <p className="text-2xl font-bold text-indigo-700">
            {conta.periodoFim ? new Date(conta.periodoFim).toLocaleDateString('pt-BR') : 'Não expira'}
          </p>
        </div>
      </div>
      <portal.Mensagem />
      <div className="flex flex-wrap gap-3">
        {conta.assinante ? (
          <button className={botao} disabled={portal.enviando} onClick={() => portal.enviar(async () => {
            window.location.href = (await api<{ url: string }>('portal', {})).url;
          })}>{portal.enviando ? 'Abrindo…' : 'Gerenciar assinatura'}</button>
        ) : (
          <button className={botao} onClick={onVerPlanos}>Ver planos</button>
        )}
      </div>
      {conta.assinante && <p className="text-sm text-gray-500">Troque de plano, atualize o cartão, veja as notas ou cancele na página segura do Stripe.</p>}
    </Secao>
  );
};

const MinhaLoja: React.FC<{ imagens: Imagem[]; onMudou: () => void }> = ({ imagens, onMudou }) => {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [form, setForm] = useState<Loja>({ nome: '', slug: '', whatsapp: '', provador_ativo: false, limite_diario: 20 });
  const [carregou, setCarregou] = useState(false);
  const salvar = useEnvio();
  const pecas = useEnvio();

  useEffect(() => {
    api<{ loja: Loja | null }>('loja').then(({ loja }) => {
      setLoja(loja);
      if (loja) setForm({ ...loja, whatsapp: loja.whatsapp ?? '' });
      setCarregou(true);
    }).catch(() => setCarregou(true));
  }, []);

  const link = loja ? `${window.location.origin}/p/${loja.slug}` : '';
  const flatLays = imagens.filter(i => i.tipo === 'flatLay');
  const set = (k: keyof Loja) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const sugerirSlug = (nome: string) =>
    nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

  if (!carregou) return null;
  return (
    <Secao titulo="Minha loja e provador público">
      <p className="text-gray-600 text-sm">
        Com o provador público ligado, suas clientes experimentam as peças que você publicar, pelo link da loja.
        Cada prova gasta créditos da sua conta: 2 (modelo + look) por cliente.
      </p>
      <form className="grid sm:grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); salvar.enviar(async () => {
        const { loja } = await api<{ loja: Loja }>('loja', { ...form, limite_diario: Number(form.limite_diario) });
        setLoja(loja);
        return 'Loja salva.';
      }); }}>
        <label className="text-sm text-gray-600">Nome da loja
          <input className={campo} value={form.nome} required maxLength={80}
            onChange={e => setForm({ ...form, nome: e.target.value, slug: loja ? form.slug : sugerirSlug(e.target.value) })} />
        </label>
        <label className="text-sm text-gray-600">Endereço do provador
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-1 whitespace-nowrap">/p/</span>
            <input className={campo} value={form.slug} onChange={set('slug')} required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" title="3 a 40 letras minúsculas, números ou hífens" />
          </div>
        </label>
        <label className="text-sm text-gray-600">WhatsApp da loja (opcional)
          <input className={campo} value={form.whatsapp ?? ''} onChange={set('whatsapp')} placeholder="13 99999-9999" inputMode="tel" />
        </label>
        <label className="text-sm text-gray-600">Limite de provas por dia
          <input className={campo} type="number" min={1} max={500} value={form.limite_diario} onChange={set('limite_diario')} required />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
          <input type="checkbox" checked={form.provador_ativo} onChange={set('provador_ativo')} />
          Provador público ligado
        </label>
        <div className="sm:col-span-2 space-y-2">
          <salvar.Mensagem />
          <div className="flex flex-wrap gap-3">
            <button className={botao} disabled={salvar.enviando}>{salvar.enviando ? 'Salvando…' : loja ? 'Salvar loja' : 'Criar loja'}</button>
            {loja && (
              <button type="button" className="text-red-600 hover:underline text-sm" onClick={() => {
                if (!window.confirm('Excluir a loja? O link público para de funcionar e as peças deixam de ser publicadas.')) return;
                salvar.enviar(async () => {
                  await api('loja', undefined, 'DELETE');
                  setLoja(null);
                  setForm({ nome: '', slug: '', whatsapp: '', provador_ativo: false, limite_diario: 20 });
                  onMudou();
                  return 'Loja excluída.';
                });
              }}>Excluir loja</button>
            )}
          </div>
        </div>
      </form>

      {loja && (
        <div className="pt-4 border-t space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline break-all">{link}</a>
            <button className={botaoSec} onClick={() => navigator.clipboard.writeText(link)}>Copiar link</button>
            {!loja.provador_ativo && <span className="text-sm text-amber-700">Desligado: o link mostra "provador indisponível".</span>}
          </div>
          <h3 className="font-semibold text-gray-800">Peças no provador público</h3>
          {flatLays.length === 0 ? (
            <p className="text-sm text-gray-500">Gere flat lays no Criador Flat Lay para publicar aqui.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {flatLays.map(f => (
                <label key={f.id} className={`relative rounded-lg overflow-hidden border-4 cursor-pointer ${f.publicada ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={f.url} alt="Flat lay" className="w-full aspect-square object-cover" />
                  <span className="absolute top-1 left-1 bg-white/90 rounded px-1 text-xs flex items-center gap-1">
                    <input type="checkbox" checked={f.publicada} disabled={pecas.enviando}
                      onChange={e => pecas.enviar(async () => { await api(`imagens?id=${f.id}`, { publicada: e.target.checked }, 'PATCH'); onMudou(); })} />
                    Publicada
                  </span>
                </label>
              ))}
            </div>
          )}
          <pecas.Mensagem />
        </div>
      )}
    </Secao>
  );
};

const Excluir: React.FC<{ onExcluida: () => void }> = ({ onExcluida }) => {
  const [confirmacao, setConfirmacao] = useState('');
  const excluir = useEnvio();
  return (
    <Secao titulo="Excluir conta">
      <p className="text-sm text-gray-600">
        Apaga para sempre sua conta, todas as imagens guardadas e sua loja. Se você tem assinatura, cancele antes em
        "Gerenciar assinatura".
      </p>
      <form className="flex flex-wrap items-center gap-3" onSubmit={e => { e.preventDefault(); excluir.enviar(async () => {
        await api('conta', { confirmacao }, 'DELETE');
        onExcluida();
      }); }}>
        <input className={`${campo} max-w-xs`} placeholder='Digite EXCLUIR' value={confirmacao} onChange={e => setConfirmacao(e.target.value)} />
        <button className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60" disabled={confirmacao !== 'EXCLUIR' || excluir.enviando}>
          {excluir.enviando ? 'Excluindo…' : 'Excluir minha conta'}
        </button>
      </form>
      <excluir.Mensagem />
    </Secao>
  );
};

const Conta: React.FC<ContaProps> = ({ conta, imagens, onMudou, onVerPlanos, onExcluida }) => (
  <div className="max-w-4xl mx-auto space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Minha conta</h1>
    <Plano conta={conta} onVerPlanos={onVerPlanos} />
    <MinhaLoja imagens={imagens} onMudou={onMudou} />
    <Perfil />
    <Excluir onExcluida={onExcluida} />
  </div>
);

export default Conta;
