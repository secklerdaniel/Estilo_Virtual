import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ClothingItem } from '../types';
import { generateTryOn, generateBaseModel, changePose } from '../services/imageService';
import { CameraIcon, UploadIcon, SparklesIcon, MagicWandIcon, DownloadIcon } from './icons/Icons';

interface VirtualTryOnProps {
  savedFlatLays?: ClothingItem[];
  baseModel: string | null;
  setBaseModel: (model: string | null) => void;
}

const POSE_OPTIONS: { [key: string]: string } = {
  "Vista 3/4": "Slightly turned, 3/4 view",
  "Perfil": "Side profile view",
  "Andando": "Walking towards camera",
  "Apoiado": "Leaning against a wall",
};

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ savedFlatLays = [], baseModel, setBaseModel }) => {
  const [originalUserImage, setOriginalUserImage] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCreatingModel, setIsCreatingModel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChangingPose, setIsChangingPose] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const allClothingItems = savedFlatLays;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setOriginalUserImage(null);
        setBaseModel(null); // Clear existing model
        setGeneratedImage(null);
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setOriginalUserImage(dataUrl.split(',')[1]);
        setGeneratedImage(null);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          stopCamera();
          setOriginalUserImage(e.target.result.split(',')[1]);
          setBaseModel(null); // Clear existing model
          setGeneratedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getBase64FromImageUrl = async (imageUrl: string): Promise<string> => {
    if (imageUrl.startsWith('data:')) {
      return imageUrl.split(',')[1];
    }
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerateBaseModel = useCallback(async () => {
    if (!originalUserImage) {
      setError("Primeiro, envie ou tire uma foto sua.");
      return;
    }
    setIsCreatingModel(true);
    setError(null);
    try {
      const resultBase64 = await generateBaseModel(originalUserImage);
      setBaseModel(resultBase64);
      setOriginalUserImage(null); // Clear original photo now that we have the model
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsCreatingModel(false);
    }
  }, [originalUserImage, setBaseModel]);
  
  const handleGenerate = useCallback(async () => {
    if (!baseModel) {
      setError("Por favor, crie seu modelo base primeiro.");
      return;
    }
    if (!selectedClothing) {
      setError("Por favor, selecione uma peça de roupa.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Peça guardada na conta: o servidor busca no R2 pelo id (sem baixar no navegador).
      const clothingBase64 = selectedClothing.imageUrl.startsWith('data:')
        ? await getBase64FromImageUrl(selectedClothing.imageUrl)
        : `imagem:${selectedClothing.id}`;
      const resultBase64 = await generateTryOn(baseModel, clothingBase64);
      setGeneratedImage(resultBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [baseModel, selectedClothing]);

  const handleChangePose = useCallback(async (poseInstruction: string) => {
    if (!generatedImage) {
      setError("Não há imagem de resultado para alterar a pose.");
      return;
    }

    setIsChangingPose(true);
    setError(null);
    
    try {
      const resultBase64 = await changePose(generatedImage, poseInstruction);
      setGeneratedImage(resultBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao mudar a pose.");
    } finally {
      setIsChangingPose(false);
    }
  }, [generatedImage]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const userImageToShow = baseModel || originalUserImage;

  return (
    <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Provador Virtual</h1>
          <p className="text-lg text-gray-600 mt-2">Veja como as peças ficam em você antes de comprar!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Coluna 1: Imagem do usuário */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">1. {baseModel ? 'Seu Modelo Salvo' : 'Sua Foto'}</h2>
            <div className="relative w-full aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {isCreatingModel && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white z-10 p-4">
                    <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-semibold text-center">Criando seu modelo base...</p>
                  </div>
                )}
                {isCameraOn ? (
                    <video ref={videoRef} autoPlay className="w-full h-full object-cover"></video>
                ) : userImageToShow ? (
                  <>
                    <img src={`data:image/jpeg;base64,${userImageToShow}`} alt="Usuário" className="w-full h-full object-contain"/>
                     {baseModel && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600 bg-opacity-80 text-white text-xs font-bold text-center py-1">
                        Modelo Salvo
                      </div>
                    )}
                  </>
                ) : (
                    <div className="text-center text-gray-500">
                        <CameraIcon className="mx-auto" />
                        <p>Sua imagem aqui</p>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                {isCameraOn ? (
                    <button onClick={capturePhoto} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Tirar Foto</button>
                ) : (
                    <button onClick={startCamera} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"><CameraIcon className="w-5 h-5 mr-2"/>{baseModel ? 'Usar Outra Foto (Câmera)' : 'Ligar Câmera'}</button>
                )}
                <input type="file" id="upload-photo" className="hidden" accept="image/jpeg, image/png" onChange={handleFileUpload} />
                <label htmlFor="upload-photo" className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer flex items-center justify-center"><UploadIcon className="w-5 h-5 mr-2"/>{baseModel ? 'Usar Outra Foto (Arquivo)' : 'Enviar Foto'}</label>
                
                {originalUserImage && !baseModel && (
                   <button
                    onClick={handleGenerateBaseModel}
                    disabled={isCreatingModel}
                    className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center justify-center disabled:bg-purple-300 disabled:cursor-not-allowed mt-2"
                  >
                    {isCreatingModel ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </>
                    ) : (
                      <>
                        <MagicWandIcon className="mr-2"/>
                        Criar e Salvar Modelo
                      </>
                    )}
                  </button>
                )}
            </div>
          </div>

          {/* Coluna 2: Seleção de Roupas */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">2. Escolha a Peça</h2>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {allClothingItems.length > 0 ? (
                  allClothingItems.map(item => (
                      <div key={item.id} onClick={() => setSelectedClothing(item)} className={`cursor-pointer rounded-lg overflow-hidden border-4 ${selectedClothing?.id === item.id ? 'border-indigo-500' : 'border-transparent'} transition-all`}>
                          <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover" />
                          <p className="text-center text-sm font-medium bg-gray-100 p-1 truncate">{item.name}</p>
                      </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500 p-8 bg-gray-100 rounded-lg">
                    <p className="font-semibold">Nenhum flat lay salvo.</p>
                    <p className="text-sm mt-2">Vá para o 'Criador Flat Lay' para criar e salvar looks para experimentar aqui!</p>
                  </div>
                )}
            </div>
          </div>
          
          {/* Coluna 3: Resultado */}
          <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">3. Resultado</h2>
            <div className="relative w-full aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {(isLoading || isChangingPose) ? (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white z-10 p-4">
                      <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="font-semibold text-center">{isLoading ? 'Provando a roupa...' : 'Ajustando a pose...'}</p>
                    </div>
                ) : generatedImage ? (
                    <>
                      <img src={`data:image/png;base64,${generatedImage}`} alt="Resultado do Provador" className="w-full h-full object-contain"/>
                      <a
                        href={`data:image/png;base64,${generatedImage}`}
                        download="estilo-virtual-look.png"
                        className="absolute top-4 right-4 bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                        aria-label="Baixar imagem do look"
                        title="Baixar Look"
                      >
                        <DownloadIcon />
                      </a>
                    </>
                ) : (
                    <div className="text-center text-gray-500 p-4">
                        <SparklesIcon className="mx-auto" />
                        <p>Seu novo look aparecerá aqui</p>
                    </div>
                )}
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || isChangingPose || !baseModel || !selectedClothing}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
                {isLoading || isChangingPose ? (
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
                    Gerar Look
                    </>
                )}
            </button>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            
            {generatedImage && !isLoading && !isChangingPose && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-bold mb-3 text-center">Mudar a Pose</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(POSE_OPTIONS).map(([label, instruction]) => (
                    <button
                      key={label}
                      onClick={() => handleChangePose(instruction)}
                      disabled={isChangingPose}
                      className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default VirtualTryOn;
