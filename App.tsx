import React, { useState, useCallback, useEffect } from 'react';
import { Page, ClothingItem } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import FlatLayCreator from './components/FlatLayCreator';
import VirtualTryOn from './components/VirtualTryOn';
import Login from './components/Login';
import { api, authClient, concluirLoginSocial, Conta } from './services/auth';

const CHAVE_FLAT_LAYS = 'estilo-virtual:flat-lays';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  // Guardadas no navegador: sobrevivem ao recarregar e à ida e volta do pagamento no Stripe.
  const [savedFlatLays, setSavedFlatLays] = useState<ClothingItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(CHAVE_FLAT_LAYS) ?? '[]'); } catch { return []; }
  });
  const [baseModelImage, setBaseModelImage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  // Plano escolhido antes do login: o checkout abre assim que a pessoa entrar.
  const [planoPendente, setPlanoPendente] = useState<string | null>(null);

  const atualizarConta = useCallback(async () => {
    const { data } = await authClient.getSession();
    setEmail(data?.user?.email ?? null);
    setConta(data?.user ? await api<Conta>('me').catch(() => null) : null);
    setCarregando(false);
  }, []);

  useEffect(() => {
    concluirLoginSocial().then(atualizarConta);
    window.addEventListener('conta-mudou', atualizarConta);
    const checkout = new URLSearchParams(window.location.search).get('checkout');
    if (checkout) {
      setAviso(checkout === 'sucesso'
        ? 'Pagamento recebido! Sua assinatura é ativada em alguns segundos.'
        : 'Pagamento cancelado. Nenhuma cobrança foi feita.');
      window.history.replaceState(null, '', window.location.pathname);
      // O webhook do Stripe pode chegar alguns segundos depois do redirect.
      if (checkout === 'sucesso') [3000, 8000].forEach(ms => setTimeout(atualizarConta, ms));
    }
    return () => window.removeEventListener('conta-mudou', atualizarConta);
  }, [atualizarConta]);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const assinar = useCallback(async (plano: string) => {
    if (!email) {
      setPlanoPendente(plano);
      return setCurrentPage('login');
    }
    try {
      window.location.href = (await api<{ url: string }>('checkout', { plano })).url;
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Não foi possível abrir o pagamento.');
    }
  }, [email]);

  const entrou = useCallback(async () => {
    await atualizarConta();
    if (planoPendente) {
      const plano = planoPendente;
      setPlanoPendente(null);
      window.location.href = (await api<{ url: string }>('checkout', { plano })).url;
    } else {
      setCurrentPage('flatLay');
    }
  }, [atualizarConta, planoPendente]);

  const sair = useCallback(async () => {
    await authClient.signOut();
    setEmail(null);
    setConta(null);
    setCurrentPage('home');
  }, []);

  useEffect(() => {
    // ponytail: localStorage (~5 MB, umas 10-20 imagens); se lotar, descarta as mais antigas. Mais que isso pede IndexedDB ou banco.
    for (let n = savedFlatLays.length; n >= 0; n--) {
      try { return localStorage.setItem(CHAVE_FLAT_LAYS, JSON.stringify(savedFlatLays.slice(0, n))); } catch { /* cheio: tenta com menos */ }
    }
  }, [savedFlatLays]);

  const addSavedFlatLay = useCallback((base64Image: string) => {
    const newFlatLay: ClothingItem = {
      id: Date.now(),
      name: `Meu Flat Lay #${savedFlatLays.length + 1}`,
      // O imageUrl para o provador já é o data URL completo
      imageUrl: `data:image/${base64Image.startsWith('/9j/') ? 'jpeg' : 'png'};base64,${base64Image}`,
    };
    setSavedFlatLays(prev => [newFlatLay, ...prev]);
  }, [savedFlatLays]);

  const renderPage = () => {
    // As ferramentas gastam créditos: sem login, mostra o cadastro.
    if (!carregando && !email && (currentPage === 'flatLay' || currentPage === 'tryOn' || currentPage === 'login')) {
      return <Login onEntrou={entrou} cadastroInicial={currentPage !== 'login'} />;
    }
    switch (currentPage) {
      case 'flatLay':
        return <FlatLayCreator onSaveForTryOn={addSavedFlatLay} />;
      case 'tryOn':
        return <VirtualTryOn
                  savedFlatLays={savedFlatLays}
                  baseModel={baseModelImage}
                  setBaseModel={setBaseModelImage}
                />;
      case 'home':
      default:
        return <Home navigateTo={navigateTo} onAssinar={assinar} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      <Header navigateTo={navigateTo} email={email} conta={conta} onSair={sair} onAssinar={assinar} />
      {aviso && (
        <div className="bg-indigo-600 text-white text-center px-4 py-3 flex justify-center items-center gap-4" role="status">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="underline text-sm">Fechar</button>
        </div>
      )}
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
