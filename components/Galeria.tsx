import React, { useState } from 'react';
import { api, Imagem } from '../services/auth';

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

const Galeria: React.FC<GaleriaProps> = ({ imagens, onMudou }) => {
  const [apagando, setApagando] = useState<string | null>(null);

  const apagar = async (id: string) => {
    if (!window.confirm('Apagar esta imagem? Não dá para desfazer.')) return;
    setApagando(id);
    await api(`imagens?id=${id}`, undefined, 'DELETE').catch(() => {});
    setApagando(null);
    onMudou();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Minhas imagens</h2>
      <p className="text-gray-600 mb-8">Tudo o que você gerou fica guardado aqui, em qualquer aparelho em que você entrar.</p>

      {imagens.length === 0 ? (
        <p className="text-gray-500 bg-white rounded-xl shadow p-8 text-center">Você ainda não gerou nenhuma imagem.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imagens.map(img => (
            <figure key={img.id} className="bg-white rounded-xl shadow overflow-hidden">
              <a href={img.url} target="_blank" rel="noopener noreferrer">
                <img src={img.url} alt={TIPO[img.tipo]} className="w-full aspect-[3/4] object-cover" loading="lazy" />
              </a>
              <figcaption className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-gray-700">
                  {TIPO[img.tipo]} · {new Date(img.criadaEm).toLocaleDateString('pt-BR')}
                </span>
                <button
                  onClick={() => apagar(img.id)}
                  disabled={apagando === img.id}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  Apagar
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
};

export default Galeria;
