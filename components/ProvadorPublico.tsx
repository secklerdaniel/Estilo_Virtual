import React, { useEffect, useState } from 'react';
import { reduzirFoto } from '../services/foto';

// Provador da loja em /p/<slug>: página pública, sem login. Chama /api/vitrine.
type Vitrine = { nome: string; whatsapp?: string | null; ativo: boolean; pecas: { id: string; url: string }[] };

const slug = () => decodeURIComponent(window.location.pathname.split('/')[2] ?? '');

async function vitrine<T>(body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(body ? '/api/vitrine' : `/api/vitrine?slug=${encodeURIComponent(slug())}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify({ slug: slug(), ...body }) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Algo deu errado. Tente novamente.');
  return json;
}

const Girando: React.FC<{ texto: string }> = ({ texto }) => (
  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10 p-4 text-center">
    <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <p className="font-semibold">{texto}</p>
  </div>
);

const ProvadorPublico: React.FC = () => {
  const [loja, setLoja] = useState<Vitrine | null>(null);
  const [erroLoja, setErroLoja] = useState<string | null>(null);
  const [consentiu, setConsentiu] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [modelo, setModelo] = useState<string | null>(null);
  const [peca, setPeca] = useState<string | null>(null);
  const [look, setLook] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<'modelo' | 'look' | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    vitrine<Vitrine>().then(setLoja).catch(e => setErroLoja(e.message));
  }, []);

  useEffect(() => {
    if (loja?.nome) document.title = `Provador — ${loja.nome}`;
  }, [loja]);

  const gerar = async (acao: 'modelo' | 'look') => {
    setOcupado(acao);
    setErro(null);
    try {
      if (acao === 'modelo') {
        const { image } = await vitrine<{ image: string }>({ action: 'baseModel', foto, consentimento: consentiu });
        setModelo(image);
        setLook(null);
      } else {
        const { image } = await vitrine<{ image: string }>({ action: 'tryOn', modelo, peca, consentimento: consentiu });
        setLook(image);
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  if (erroLoja) return <p className="text-center text-gray-600 mt-20">{erroLoja}</p>;
  if (!loja) return null;
  if (!loja.ativo)
    return (
      <div className="text-center mt-20">
        <h1 className="text-3xl font-bold text-gray-900">{loja.nome}</h1>
        <p className="text-gray-600 mt-3">O provador virtual desta loja está indisponível no momento.</p>
      </div>
    );

  const whats = loja.whatsapp
    ? `https://wa.me/55${loja.whatsapp}?text=${encodeURIComponent(`Olá! Provei uma peça no provador virtual da ${loja.nome} e quero saber mais.`)}`
    : null;
  const botao = 'w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed';
  const mostrar = look ?? modelo ?? (foto && `data:image/jpeg;base64,${foto}`);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{loja.nome}</h1>
        <p className="text-gray-600 mt-2">Provador virtual: veja como as peças ficam em você antes de comprar.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-bold text-lg">1. Sua foto</h2>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={consentiu} onChange={e => setConsentiu(e.target.checked)} className="mt-1" />
            <span>
              Confirmo que a foto é minha, que sou maior de idade e autorizo o uso dela só para gerar esta prova. A foto
              não fica guardada. <a href="/privacidade" target="_blank" className="text-indigo-600 hover:underline">Privacidade</a>
            </span>
          </label>
          <label className={`block text-center border-2 border-dashed rounded-lg p-4 ${consentiu ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}>
            <input type="file" accept="image/*" className="hidden" disabled={!consentiu}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) reduzirFoto(f).then(({ base64 }) => { setFoto(base64); setModelo(null); setLook(null); })
                  .catch(() => setErro('Não foi possível ler esta foto.'));
              }} />
            <span className="font-semibold text-indigo-600">{foto ? 'Trocar foto' : 'Enviar ou tirar foto'}</span>
            <span className="block text-xs text-gray-500 mt-1">De corpo inteiro, de frente, com boa luz.</span>
          </label>
          <button className={botao} disabled={!foto || !!ocupado || !!modelo} onClick={() => gerar('modelo')}>
            {modelo ? 'Modelo pronto' : 'Criar meu modelo'}
          </button>

          <h2 className="font-bold text-lg pt-2">2. Escolha a peça</h2>
          {loja.pecas.length === 0 ? (
            <p className="text-sm text-gray-500">A loja ainda não publicou peças.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {loja.pecas.map(p => (
                <button key={p.id} onClick={() => setPeca(p.id)}
                  className={`rounded-lg overflow-hidden border-4 ${peca === p.id ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={p.url} alt="Peça" className="w-full aspect-square object-cover" />
                </button>
              ))}
            </div>
          )}
          <button className={botao} disabled={!modelo || !peca || !!ocupado} onClick={() => gerar('look')}>Provar</button>
          {erro && <p className="text-red-600 text-sm text-center" role="alert">{erro}</p>}
        </div>

        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="font-bold text-lg">3. Resultado</h2>
          <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {ocupado && <Girando texto={ocupado === 'modelo' ? 'Criando seu modelo…' : 'Provando a peça…'} />}
            {mostrar
              ? <img src={mostrar.startsWith('data:') ? mostrar : `data:image/jpeg;base64,${mostrar}`} alt="Você" className="w-full h-full object-contain" />
              : <p className="text-gray-400 p-6 text-center">Seu look aparece aqui</p>}
          </div>
          {look && (
            <div className="grid gap-2">
              <a href={`data:image/jpeg;base64,${look}`} download={`provador-${slug()}.jpg`}
                className="text-center bg-gray-100 font-semibold py-3 rounded-lg hover:bg-gray-200">Baixar imagem</a>
              {whats && (
                <a href={whats} target="_blank" rel="noopener noreferrer"
                  className="text-center bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Gostei! Falar com a loja no WhatsApp</a>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">Simulação feita por IA: tamanho e caimento reais podem variar.</p>
        </div>
      </div>
    </div>
  );
};

export default ProvadorPublico;
