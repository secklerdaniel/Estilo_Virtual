import React, { useState } from 'react';
import { zipSync } from 'fflate';
import { api, baixar, Imagem } from '../services/auth';

interface GaleriaProps {
  imagens: Imagem[];
  onMudou: () => void;
}

const TIPO: Record<Imagem['tipo'], string> = {
  flatLay: 'Flat lay',
  baseModel: 'Modelo base',
  tryOn: 'Provador',
  pose: 'Nova pose',
};

const nomeArquivo = (img: Imagem, n: number) =>
  `${String(n + 1).padStart(3, '0')}-${TIPO[img.tipo].toLowerCase().replace(/\s+/g, '-')}-${img.criadaEm.slice(0, 10)}.jpg`;

const Galeria: React.FC<GaleriaProps> = ({ imagens, onMudou }) => {
  const [apagando, setApagando] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [baixando, setBaixando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const alternar = (id: string) =>
    setMarcadas(m => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const apagar = async (id: string) => {
    if (!window.confirm('Apagar esta imagem? Não dá para desfazer.')) return;
    setApagando(id);
    await api(`imagens?id=${id}`, undefined, 'DELETE').catch(() => {});
    setApagando(null);
    setMarcadas(m => { const n = new Set(m); n.delete(id); return n; });
    onMudou();
  };

  // Busca cada imagem pelo servidor (o bucket é privado) e monta o zip no navegador.
  const baixarZip = async () => {
    const lista = imagens.filter(i => marcadas.has(i.id));
    setErro(null);
    try {
      const arquivos: Record<string, Uint8Array> = {};
      for (const [n, img] of lista.entries()) {
        setBaixando(`${n + 1} de ${lista.length}`);
        arquivos[nomeArquivo(img, n)] = await baixar(`imagens?arquivo=${img.id}`);
      }
      // JPEG já é comprimido: level 0 só empacota, bem mais rápido.
      const zip = zipSync(arquivos, { level: 0 });
      const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `estilo-virtual-${new Date().toISOString().slice(0, 10)}.zip` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setBaixando(null);
    }
  };

  const todas = imagens.length > 0 && marcadas.size === imagens.length;

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Minhas imagens</h2>
      <p className="text-gray-600 mb-6">Tudo o que você gerou fica guardado aqui, em qualquer aparelho em que você entrar.</p>

      {imagens.length === 0 ? (
        <p className="text-gray-500 bg-white rounded-xl shadow p-8 text-center">Você ainda não gerou nenhuma imagem.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={todas} onChange={() => setMarcadas(todas ? new Set() : new Set(imagens.map(i => i.id)))} />
              Selecionar todas
            </label>
            <button
              onClick={baixarZip}
              disabled={marcadas.size === 0 || !!baixando}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {baixando ? `Baixando ${baixando}…` : `Baixar selecionadas (${marcadas.size}) em .zip`}
            </button>
            {erro && <span className="text-red-600 text-sm">{erro}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagens.map(img => (
              <figure key={img.id} className={`bg-white rounded-xl shadow overflow-hidden border-4 ${marcadas.has(img.id) ? 'border-indigo-500' : 'border-transparent'}`}>
                <div className="relative">
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={TIPO[img.tipo]} className="w-full aspect-[3/4] object-cover" loading="lazy" />
                  </a>
                  <input type="checkbox" checked={marcadas.has(img.id)} onChange={() => alternar(img.id)}
                    className="absolute top-2 left-2 w-5 h-5" aria-label="Selecionar imagem" />
                </div>
                <figcaption className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-700">
                    {TIPO[img.tipo]} · {new Date(img.criadaEm).toLocaleDateString('pt-BR')}
                  </span>
                  <button onClick={() => apagar(img.id)} disabled={apagando === img.id} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                    Apagar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Galeria;
