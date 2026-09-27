
import React from 'react';
import { Page } from '../types';
import { Conta } from '../services/auth';

interface HeaderProps {
  navigateTo: (page: Page) => void;
  email: string | null;
  conta: Conta | null;
  onSair: () => void;
  onAssinar: (plano: string) => void;
}

const NOME_PLANO = { gratis: 'Grátis', essencial: 'Essencial', profissional: 'Profissional', ilimitado: 'Ilimitado' };

const verPlanos = (navigateTo: (page: Page) => void) => {
  navigateTo('home');
  setTimeout(() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' }), 50);
};

const Header: React.FC<HeaderProps> = ({ navigateTo, email, conta, onSair, onAssinar }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="text-2xl font-bold text-gray-900 cursor-pointer"
          onClick={() => navigateTo('home')}
        >
          Estilo<span className="text-indigo-600">Virtual</span>
        </div>
        <ul className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
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
          {email ? (
            <li className="flex items-center gap-3 text-sm">
              {conta && (
                <button
                  onClick={() => conta.assinante ? onAssinar(conta.plano) : verPlanos(navigateTo)}
                  className="bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full hover:bg-indigo-100"
                  title={conta.assinante ? 'Gerenciar assinatura' : 'Ver planos'}
                >
                  {conta.status === 'inadimplente' ? 'Pagamento pendente'
                    : conta.status === 'cancelada' ? 'Assinatura cancelada'
                    : `${NOME_PLANO[conta.plano]} · ${conta.restantes} crédito${conta.restantes === 1 ? '' : 's'}`}
                </button>
              )}
              <span className="text-gray-500 hidden md:inline">{email}</span>
              <button onClick={onSair} className="text-gray-600 hover:text-indigo-600">Sair</button>
            </li>
          ) : (
            <li>
              <button onClick={() => navigateTo('login')} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
                Entrar
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
