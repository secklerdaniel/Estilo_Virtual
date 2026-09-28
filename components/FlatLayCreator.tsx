
import React, { useState, useCallback, useEffect } from 'react';
import { UploadedImage } from '../types';
import { reduzirFoto } from '../services/foto';
import { api, Peca } from '../services/auth';
import { generateFlatLay } from '../services/imageService';
import { UploadIcon, TrashIcon, SparklesIcon, DownloadIcon, TryOnIcon } from './icons/Icons';

const MAX_IMAGES = 5;

interface FlatLayCreatorProps {
  onSaveForTryOn: (base64Image: string) => void;
  pecas: Peca[];
  onPecasMudou: () => void;
}

const semExtensao = (nome: string) => nome.replace(/\.[^.]+$/, '').slice(0, 80) || 'Peça';

const FlatLayCreator: React.FC<FlatLayCreatorProps> = ({ onSaveForTryOn, pecas, onPecasMudou }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  // Foto nova vai para a biblioteca (Minhas peças) para reaproveitar em outros looks.
  const [guardar, setGuardar] = useState(true);
  const [verBiblioteca, setVerBiblioteca] = useState(false);
  const [enviando, setEnviando] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redefine o status 'salvo' sempre que uma nova imagem é gerada
    if (generatedImage) {
      setIsSaved(false);
    }
  }, [generatedImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files: File[] = Array.from(event.target.files);
      if (images.length + files.length > MAX_IMAGES) {
        setError(`Você pode enviar no máximo ${MAX_IMAGES} imagens.`);
        return;
      }
      setError(null);
      
      files.forEach(async file => {
        setEnviando(n => n + 1);
        try {
          // 1280 px: até 5 peças no mesmo pedido cabem folgado no limite da Vercel.
          const { base64, dataUrl } = await reduzirFoto(file, 1280);
          const nome = semExtensao(file.name);
          if (guardar) {
            const { peca } = await api<{ peca: Peca }>('pecas', { nome, imagem: base64 });
            setImages(prev => [...prev, { name: nome, preview: dataUrl, pecaId: peca.id }]);
            onPecasMudou();
          } else {
            setImages(prev => [...prev, { name: nome, preview: dataUrl, base64 }]);
          }
        } catch (err) {
          setError(err instanceof Error && err.message ? err.message : `Não foi possível ler ${file.name}. Use uma foto JPG ou PNG.`);
        } finally {
          setEnviando(n => n - 1);
        }
      });
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleGenerate = useCallback(async () => {
    if (images.length < 2) {
      setError("Por favor, envie pelo menos 2 imagens para criar o flat lay.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const resultBase64 = (await generateFlatLay(images.map(img => (img.pecaId ? `peca:${img.pecaId}` : img.base64!)))).image;
      setGeneratedImage(resultBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [images]);
  
  const handleSaveForTryOn = () => {
    if (generatedImage) {
      onSaveForTryOn(generatedImage);
      setIsSaved(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Criador de Flat Lay</h1>
        <p className="text-lg text-gray-600 mt-2">Escolha peças da sua biblioteca ou envie fotos novas, e a IA monta o look.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Painel de Upload */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">1. Escolha as peças</h2>

          <button
            onClick={() => setVerBiblioteca(v => !v)}
            className="w-full mb-4 bg-white border-2 border-indigo-600 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50"
          >
            {verBiblioteca ? 'Fechar biblioteca' : `Escolher da biblioteca (${pecas.length})`}
          </button>
          {verBiblioteca && (
            <div className="mb-6">
              {pecas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">Sua biblioteca está vazia. As fotos que você enviar abaixo ficam guardadas nela.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {pecas.map(p => {
                    const escolhida = images.some(i => i.pecaId === p.id);
                    return (
                      <button key={p.id} title={p.nome}
                        disabled={escolhida || images.length >= MAX_IMAGES}
                        onClick={() => { setError(null); setImages(prev => [...prev, { name: p.nome, preview: p.url, pecaId: p.id }]); }}
                        className={`relative rounded-md overflow-hidden border-2 ${escolhida ? 'border-indigo-500 opacity-60' : 'border-transparent hover:border-indigo-300'} disabled:cursor-not-allowed`}>
                        <img src={p.url} alt={p.nome} className="w-full aspect-square object-cover" loading="lazy" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] truncate px-1">{p.nome}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
            <UploadIcon className="mx-auto text-gray-400" />
            <p className="text-gray-500 my-2">Ou envie fotos novas das peças.</p>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={images.length >= MAX_IMAGES}
            />
            <label 
              htmlFor="file-upload"
              className={`cursor-pointer inline-block bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 transition-colors ${images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Enviar fotos
            </label>
            <p className="text-xs text-gray-400 mt-2">Até {MAX_IMAGES} peças por look.</p>
            <label className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-3">
              <input type="checkbox" checked={guardar} onChange={e => setGuardar(e.target.checked)} />
              Guardar as fotos novas na biblioteca
            </label>
            {enviando > 0 && <p className="text-sm text-indigo-600 mt-2">Enviando {enviando} foto(s)…</p>}
          </div>

          {images.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Peças deste look ({images.length}/{MAX_IMAGES}):</h3>
              <div className="grid grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                    <img src={image.preview} alt={image.name} title={image.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 hover:text-red-700 shadow"
                      aria-label={`Remover ${image.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || images.length < 2 || enviando > 0}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2"/>
                Gerar Flat Lay
              </>
            )}
          </button>
          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>

        {/* Painel de Resultado */}
        <div className="bg-white p-8 rounded-xl shadow-lg h-full">
          <h2 className="text-2xl font-bold mb-4">2. Resultado</h2>
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
            {isLoading && <p className="text-gray-500">Aguarde, a mágica está acontecendo...</p>}
            {!isLoading && !generatedImage && <p className="text-gray-500 text-center p-4">Seu flat lay aparecerá aqui.</p>}
            {generatedImage && (
              <>
                <img 
                  src={`data:image/jpeg;base64,${generatedImage}`} 
                  alt="Flat lay gerado" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                  <a
                    href={`data:image/jpeg;base64,${generatedImage}`}
                    download="estilo-virtual-flat-lay.jpg"
                    className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    aria-label="Baixar imagem do flat lay"
                    title="Baixar Imagem"
                  >
                    <DownloadIcon />
                  </a>
                  <button
                    onClick={handleSaveForTryOn}
                    disabled={isSaved}
                    className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-green-500 disabled:cursor-auto"
                    aria-label="Usar no Provador Virtual"
                    title="Usar no Provador"
                  >
                    {isSaved ? <span className="text-xs font-bold">✔️</span> : <TryOnIcon />}
                  </button>
                </div>
              </>
            )}
          </div>
           {generatedImage && (
              <div className="text-center mt-4">
                 <button
                    onClick={handleSaveForTryOn}
                    disabled={isSaved}
                    className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:bg-green-500 disabled:cursor-auto"
                  >
                    <TryOnIcon className="mr-2" />
                    {isSaved ? 'Salvo para o Provador!' : 'Usar no Provador'}
                  </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FlatLayCreator;
