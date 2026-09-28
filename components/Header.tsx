import React from 'react';
import { Page } from '../types';
import { Conta } from '../services/auth';

interface HeaderProps {
  navigateTo: (page: Page) => void;
  email: string | null;
  conta: Conta | null;
  onSair: () => void;
  pagina: Page;
}

const NOME_PLANO = { gratis: 'Grátis', essencial: 'Essencial', profissional: 'Profissional', ilimitado: 'Ilimitado' };

// Logado vê as ferramentas da conta; deslogado, só as duas vitrines do produto.
const LINKS_LOGADO: [Page, string][] = [
  ['painel', 'Painel'], ['pecas', 'Peças'], ['flatLay', 'Flat Lay'], ['tryOn', 'Provador'], ['galeria', 'Imagens'],
];
const LINKS_VISITANTE: [Page, string][] = [['flatLay', 'Criador Flat Lay'], ['tryOn', 'Provador Virtual']];

const Header: React.FC<HeaderProps> = ({ navigateTo, email, conta, onSair, pagina }) => {
  const link = (p: Page) =>
    `font-medium transition-colors ${pagina === p ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
        <button className="text-2xl font-bold text-gray-900" onClick={() => navigateTo('home')}>
          Estilo<span className="text-indigo-600">Virtual</span>
        </button>
        <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {(email ? LINKS_LOGADO : LINKS_VISITANTE).map(([p, nome]) => (
            <li key={p}>
              <button onClick={() => navigateTo(p)} className={link(p)} aria-current={pagina === p ? 'page' : undefined}>{nome}</button>
            </li>
          ))}
          {email ? (
            <li className="flex items-center gap-3 text-sm">
              {conta && (
                <button
                  onClick={() => navigateTo('painel')}
                  className="bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-full hover:bg-indigo-100"
                  title="Ver uso dos créditos"
                >
                  {conta.status === 'inadimplente' ? 'Pagamento pendente'
                    : conta.status === 'cancelada' ? 'Assinatura cancelada'
                    : `${NOME_PLANO[conta.plano]} · ${conta.restantes} crédito${conta.restantes === 1 ? '' : 's'}`}
                </button>
              )}
              <button onClick={() => navigateTo('conta')} className={link('conta')}>Minha conta</button>
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
