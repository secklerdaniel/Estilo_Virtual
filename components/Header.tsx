
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  navigateTo: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="text-2xl font-bold text-gray-900 cursor-pointer"
          onClick={() => navigateTo('home')}
        >
          Estilo<span className="text-indigo-600">Virtual</span>
        </div>
        <ul className="flex items-center space-x-6">
          <li>
            <button 
              onClick={() => navigateTo('flatLay')} 
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Criador Flat Lay
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigateTo('tryOn')}
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Provador Virtual
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
