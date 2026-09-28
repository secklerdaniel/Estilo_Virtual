import React, { useState, useCallback, useEffect } from 'react';
import { Page, ClothingItem, ROTAS, paginaDaUrl } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import FlatLayCreator from './components/FlatLayCreator';
import VirtualTryOn from './components/VirtualTryOn';
import Login from './components/Login';
import Galeria from './components/Galeria';
import { Gerada } from './services/imageService';
import RedefinirSenha from './components/RedefinirSenha';
import { Termos, Privacidade } from './components/Legal';
import ContaPagina from './components/Conta';
import ProvadorPublico from './components/ProvadorPublico';
import Fitness from './components/Fitness';
import Pecas from './components/Pecas';
import Painel from './components/Painel';
import { api, authClient, concluirLoginSocial, Conta, Imagem, Peca } from './services/auth';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(paginaDaUrl);
  // Imagens da conta, guardadas no R2: aparecem em qualquer aparelho em que o lojista entrar.
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const savedFlatLays: ClothingItem[] = imagens
    .filter(i => i.tipo === 'flatLay')
    .map((i, n, lista) => ({ id: i.id, name: `Flat Lay #${lista.length - n}`, imageUrl: i.url }));
  // Biblioteca de peças: carregada à parte (não muda a cada geração, e pode ser grande).
  const [pecas, setPecas] = useState<Peca[]>([]);
  const carregarPecas = useCallback(async () => {
    setPecas((await api<{ pecas: Peca[] }>('pecas').catch(() => ({ pecas: [] }))).pecas);
  }, []);
  const [baseModelImage, setBaseModelImage] = useState<Gerada | null>(null);
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
    setImagens(data?.user ? (await api<{ imagens: Imagem[] }>('imagens').catch(() => ({ imagens: [] }))).imagens : []);
    setCarregando(false);
    return !!data?.user;
  }, []);

  useEffect(() => {
    concluirLoginSocial().then(atualizarConta).then(logado => { if (logado) carregarPecas(); });
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
    const voltar = () => setCurrentPage(paginaDaUrl());
    window.addEventListener('popstate', voltar);
    return () => {
      window.removeEventListener('conta-mudou', atualizarConta);
      window.removeEventListener('popstate', voltar);
    };
  }, [atualizarConta, carregarPecas]);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    if (page !== 'loja' && window.location.pathname !== ROTAS[page]) window.history.pushState(null, '', ROTAS[page]);
    window.scrollTo(0, 0);
  }, []);

  const assinar = useCallback(async (plano: string) => {
    if (!email) {
      setPlanoPendente(plano);
      return navigateTo('login');
    }
    try {
      window.location.href = (await api<{ url: string }>('checkout', { plano })).url;
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Não foi possível abrir o pagamento.');
    }
  }, [email, navigateTo]);

  const entrou = useCallback(async () => {
    await atualizarConta();
    carregarPecas();
    if (planoPendente) {
      const plano = planoPendente;
      setPlanoPendente(null);
      window.location.href = (await api<{ url: string }>('checkout', { plano })).url;
    } else {
      navigateTo('flatLay');
    }
  }, [atualizarConta, carregarPecas, planoPendente, navigateTo]);

  const sair = useCallback(async () => {
    await authClient.signOut();
    setEmail(null);
    setConta(null);
    setImagens([]);
    setPecas([]);
    navigateTo('home');
  }, [navigateTo]);

  const verPlanos = useCallback(() => {
    navigateTo('home');
    setTimeout(() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [navigateTo]);

  // O flat lay já foi guardado ao ser gerado; aqui só recarrega a lista do provador.
  const addSavedFlatLay = useCallback(() => { atualizarConta(); }, [atualizarConta]);

  const renderPage = () => {
    // Páginas da conta: sem login, mostra o login (ou nada enquanto a sessão carrega).
    if (['flatLay', 'tryOn', 'login', 'galeria', 'conta', 'pecas', 'painel'].includes(currentPage) && !email) {
      return carregando ? null : <Login onEntrou={entrou} cadastroInicial={currentPage === 'flatLay' || currentPage === 'tryOn'} />;
    }
    switch (currentPage) {
      case 'flatLay':
        return <FlatLayCreator onSaveForTryOn={addSavedFlatLay} pecas={pecas} onPecasMudou={carregarPecas} />;
      case 'pecas':
        return <Pecas pecas={pecas} onMudou={carregarPecas} onCriarLook={() => navigateTo('flatLay')} />;
      case 'painel':
        return <Painel onVerPlanos={verPlanos} />;
      case 'tryOn':
        return <VirtualTryOn
                  savedFlatLays={savedFlatLays}
                  baseModel={baseModelImage}
                  setBaseModel={setBaseModelImage}
                />;
      case 'redefinir':
        return <RedefinirSenha onPronto={() => { setAviso('Senha nova salva! Entre com ela.'); navigateTo('login'); }} />;
      case 'conta':
        return <ContaPagina conta={conta} imagens={imagens} onMudou={atualizarConta}
                 onVerPlanos={verPlanos}
                 onExcluida={() => { setEmail(null); setConta(null); setImagens([]); setAviso('Sua conta foi excluída.'); navigateTo('home'); }} />;
      case 'fitness':
        return <Fitness navigateTo={navigateTo} onVerPlanos={verPlanos} />;
      case 'termos':
        return <Termos />;
      case 'privacidade':
        return <Privacidade />;
      case 'galeria':
        return <Galeria imagens={imagens} onMudou={atualizarConta} />;
      case 'home':
      default:
        return <Home navigateTo={navigateTo} onAssinar={assinar} />;
    }
  };

  // Provador público da loja: página da cliente final, sem o menu do lojista.
  if (currentPage === 'loja')
    return (
      <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-gray-50">
        <main className="flex-grow container mx-auto px-4 py-8"><ProvadorPublico /></main>
        <footer className="text-center text-sm text-gray-400 py-6">
          Provador por <a href="/" className="text-indigo-600 hover:underline">EstiloVirtual</a>
        </footer>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      <Header navigateTo={navigateTo} email={email} conta={conta} onSair={sair} pagina={currentPage} />
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
