import React, { useState, useCallback } from 'react';
import { Page, ClothingItem } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import FlatLayCreator from './components/FlatLayCreator';
import VirtualTryOn from './components/VirtualTryOn';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [savedFlatLays, setSavedFlatLays] = useState<ClothingItem[]>([]);
  const [baseModelImage, setBaseModelImage] = useState<string | null>(null);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const addSavedFlatLay = useCallback((base64Image: string) => {
    const newFlatLay: ClothingItem = {
      id: Date.now(),
      name: `Meu Flat Lay #${savedFlatLays.length + 1}`,
      // O imageUrl para o provador já é o data URL completo
      imageUrl: `data:image/png;base64,${base64Image}`,
    };
    setSavedFlatLays(prev => [newFlatLay, ...prev]);
  }, [savedFlatLays]);

  const renderPage = () => {
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
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      <Header navigateTo={navigateTo} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
