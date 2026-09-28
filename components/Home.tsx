import React from 'react';
import { Page } from '../types';
import { ClockIcon, DollarSignIcon, CheckCircleIcon, SparklesIcon } from './icons/Icons';

interface HomeProps {
  navigateTo: (page: Page) => void;
  onAssinar: (plano: string) => void;
}

const Home: React.FC<HomeProps> = ({ navigateTo, onAssinar }) => {
  const handlePlanClick = (planName: string) => onAssinar(planName.toLowerCase());

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="text-center py-20 md:py-32 bg-gradient-to-br from-indigo-50 via-white to-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            A revolução IA para sua loja de moda
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Crie looks profissionais para seu catálogo e ofereça um provador virtual que vende por você. Tudo em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => navigateTo('flatLay')}
              className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 duration-300 text-lg shadow-lg"
            >
              Criar Looks com IA
            </button>
            <button
              onClick={() => navigateTo('tryOn')}
              className="w-full sm:w-auto bg-white text-indigo-600 font-bold py-4 px-10 rounded-lg hover:bg-indigo-50 transition-colors duration-300 text-lg border-2 border-indigo-600"
            >
              Testar Provador Virtual
            </button>
          </div>
        </div>
      </section>

      {/* New Features Section with Background Image */}
      <section
        className="relative w-full py-20 md:py-32 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/img/hero-modelos.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative container mx-auto px-4 text-center text-white z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Do Rascunho ao Provador em Segundos
          </h2>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-12">
            Transforme suas peças em looks de catálogo e permita que seus clientes os experimentem em modelos gerados por IA. Uma experiência de compra que converte.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <DollarSignIcon className="w-10 h-10 text-indigo-400 mb-3" />
              <h3 className="font-bold text-lg">Economize Dinheiro</h3>
              <p className="text-gray-300 text-sm">Corte custos com fotógrafos e estúdios.</p>
            </div>
            <div className="flex flex-col items-center">
              <ClockIcon className="w-10 h-10 text-indigo-400 mb-3" />
              <h3 className="font-bold text-lg">Agilize Lançamentos</h3>
              <p className="text-gray-300 text-sm">Crie conteúdo para coleções em minutos.</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircleIcon className="w-10 h-10 text-indigo-400 mb-3" />
              <h3 className="font-bold text-lg">Aumente a Conversão</h3>
              <p className="text-gray-300 text-sm">Clientes que provam, compram mais.</p>
            </div>
            <div className="flex flex-col items-center">
              <SparklesIcon className="w-10 h-10 text-indigo-400 mb-3" />
              <h3 className="font-bold text-lg">Inove sua Marca</h3>
              <p className="text-gray-300 text-sm">Ofereça uma experiência de compra única.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Simples, Rápido e Mágico</h2>
            <p className="text-lg text-gray-600 mt-4">Em 3 passos, você transforma suas peças em um look completo no corpo do seu cliente.</p>
          </div>
          <div className="max-w-6xl mx-auto mt-16 grid md:grid-cols-3 gap-10 items-start">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 w-full">
                <img src="/img/passo1-flat-lay.webp" alt="Passo 1: Criar o look" className="rounded-lg shadow-lg w-full h-auto aspect-square object-cover"/>
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold border-4 border-gray-50">1</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Crie seu Look</h3>
              <p className="text-gray-600">Combine suas peças e use a IA para gerar um 'flat lay' de catálogo instantaneamente.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 w-full">
                <img src="/img/passo2-modelo-base.webp" alt="Passo 2: Criar o modelo base" className="rounded-lg shadow-lg w-full h-auto aspect-[3/4] object-cover"/>
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold border-4 border-gray-50">2</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Envie sua Foto</h3>
              <p className="text-gray-600">Sua foto é transformada em um modelo base profissional, pronto para provar as roupas.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 w-full">
                <img src="/img/passo3-look-final.webp" alt="Passo 3: Experimentar o look" className="rounded-lg shadow-lg w-full h-auto aspect-[3/4] object-cover"/>
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold border-4 border-gray-50">3</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Experimente e Venda</h3>
              <p className="text-gray-600">Veja o resultado final, como se fosse mágica. Uma imagem perfeita para vender mais.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 md:py-28 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Escolha o plano ideal para sua loja</h2>
            <p className="text-lg text-gray-600 mt-4">Preços transparentes para todos os tamanhos de negócio. Cancele quando quiser.</p>
          </div>
          
          <div className="mt-16 grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan 1: Essencial */}
            <div className="border border-gray-200 rounded-2xl p-8 flex flex-col hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-gray-900">Essencial</h3>
              <p className="text-gray-500 mt-2">Para quem está começando.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-gray-900">R$470</span>
                <span className="text-lg font-medium text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 text-gray-600 flex-grow">
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span><span className="font-bold">50 créditos</span> de geração</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Criador de Flat Lay</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Provador Virtual</span></li>
              </ul>
              <button onClick={() => handlePlanClick('Essencial')} className="mt-8 w-full bg-indigo-100 text-indigo-700 font-bold py-3 px-6 rounded-lg hover:bg-indigo-200 transition-colors">
                Começar Agora
              </button>
            </div>
            
            {/* Plan 2: Profissional (Most Popular) */}
            <div className="border-2 border-indigo-600 rounded-2xl p-8 flex flex-col relative shadow-2xl">
               <span className="absolute top-0 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Mais Popular</span>
              <h3 className="text-2xl font-bold text-gray-900">Profissional</h3>
              <p className="text-gray-500 mt-2">Para lojas em crescimento.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-gray-900">R$970</span>
                <span className="text-lg font-medium text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 text-gray-600 flex-grow">
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span><span className="font-bold">200 créditos</span> de geração</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Criador de Flat Lay</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Provador Virtual</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Opção de remover marca d'água</span></li>
              </ul>
              <button onClick={() => handlePlanClick('Profissional')} className="mt-8 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                Escolher Plano
              </button>
            </div>

            {/* Plan 3: Ilimitado */}
            <div className="border border-gray-200 rounded-2xl p-8 flex flex-col hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-gray-900">Ilimitado</h3>
              <p className="text-gray-500 mt-2">Para grandes volumes e agências.</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-gray-900">R$1.470</span>
                <span className="text-lg font-medium text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 text-gray-600 flex-grow">
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Gerações <span className="font-bold">ilimitadas</span> <span className="text-gray-500 text-sm">(uso justo)</span></span></li>
                 <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Todos os recursos do Profissional</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Suporte prioritário</span></li>
                <li className="flex items-center"><CheckCircleIcon className="text-indigo-500 w-5 h-5 mr-3" /> <span>Acesso a novas funcionalidades</span></li>
              </ul>
              <button onClick={() => handlePlanClick('Ilimitado')} className="mt-8 w-full bg-indigo-100 text-indigo-700 font-bold py-3 px-6 rounded-lg hover:bg-indigo-200 transition-colors">
                Fale Conosco
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 max-w-2xl mx-auto">Pronta para Levar Sua Loja para o Próximo Nível?</h2>
            <p className="text-lg text-gray-600 mt-4 mb-8 max-w-2xl mx-auto">Comece a criar gratuitamente e veja a diferença que a IA pode fazer no seu negócio hoje mesmo.</p>
            <button
              onClick={() => navigateTo('flatLay')}
              className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 duration-300 text-lg shadow-lg"
            >
              Começar a Criar Agora
            </button>
        </div>
      </section>

    </div>
  );
};



export default Home;