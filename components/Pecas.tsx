import React, { useState } from 'react';
import { api, Peca } from '../services/auth';
import { reduzirFoto } from '../services/foto';

// Biblioteca de peças (/pecas): a foto de cada peça sobe uma vez e entra em vários looks.
interface PecasProps {
  pecas: Peca[];
  onMudou: () => void;
  onCriarLook: () => void;
}

const semExtensao = (nome: string) => nome.replace(/\.[^.]+$/, '').slice(0, 80) || 'Peça';

const Pecas: React.FC<PecasProps> = ({ pecas, onMudou, onCriarLook }) => {
  const [enviando, setEnviando] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);
  const [busca, setBusca] = useState('');

  const enviar = async (files: FileList | null) => {
    if (!files) return;
    setErro(null);
    await Promise.all(Array.from(files).map(async file => {
      setEnviando(n => n + 1);
      try {
        const { base64 } = await reduzirFoto(file, 1280);
        await api('pecas', { nome: semExtensao(file.name), imagem: base64 });
      } catch (e) {
        setErro((e as Error).message || `Não foi possível enviar ${file.name}.`);
      } finally {
        setEnviando(n => n - 1);
      }
    }));
    onMudou();
  };

  const renomear = async () => {
    if (!editando) return;
    await api(`pecas?id=${editando.id}`, { nome: editando.nome }, 'PATCH').catch(e => setErro(e.message));
    setEditando(null);
    onMudou();
  };

  const apagar = async (p: Peca) => {
    if (!window.confirm(`Apagar "${p.nome}" da biblioteca? Os looks já gerados continuam na galeria.`)) return;
    await api(`pecas?id=${p.id}`, undefined, 'DELETE').catch(e => setErro(e.message));
    onMudou();
  };

  const filtradas = pecas.filter(p => p.nome.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas peças</h1>
          <p className="text-gray-600">Suba a foto de cada peça uma vez e use em quantos looks quiser. Não gasta crédito.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
            {enviando ? `Enviando ${enviando}…` : 'Enviar peças'}
            <input type="file" accept="image/*" multiple className="hidden" disabled={enviando > 0}
              onChange={e => { enviar(e.target.files); e.target.value = ''; }} />
          </label>
          <button onClick={onCriarLook} className="bg-gray-100 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200">Montar um look</button>
        </div>
      </div>

      {erro && <p className="text-red-600 text-sm mb-4" role="alert">{erro}</p>}

      {pecas.length === 0 ? (
        <p className="text-gray-500 bg-white rounded-xl shadow p-8 text-center">
          Nenhuma peça ainda. Envie fotos das peças da sua loja (de preferência em fundo liso) para começar.
        </p>
      ) : (
        <>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={`Buscar entre ${pecas.length} peças…`}
            className="w-full md:w-80 border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtradas.map(p => (
              <figure key={p.id} className="bg-white rounded-xl shadow overflow-hidden">
                <img src={p.url} alt={p.nome} className="w-full aspect-square object-cover" loading="lazy" />
                <figcaption className="p-2 text-sm space-y-1">
                  {editando?.id === p.id ? (
                    <form onSubmit={e => { e.preventDefault(); renomear(); }} className="flex gap-1">
                      <input autoFocus value={editando.nome} maxLength={80}
                        onChange={e => setEditando({ id: p.id, nome: e.target.value })}
                        className="flex-1 min-w-0 border rounded px-1" />
                      <button className="text-indigo-600 font-semibold">OK</button>
                    </form>
                  ) : (
                    <p className="truncate text-gray-800" title={p.nome}>{p.nome}</p>
                  )}
                  <div className="flex justify-between text-xs">
                    <button onClick={() => setEditando({ id: p.id, nome: p.nome })} className="text-indigo-600 hover:underline">Renomear</button>
                    <button onClick={() => apagar(p)} className="text-red-500 hover:underline">Apagar</button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Pecas;
