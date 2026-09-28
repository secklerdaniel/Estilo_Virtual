import React, { useEffect, useState } from 'react';
import { Page } from '../types';

// Landing do nicho fitness (/fitness), método "fogo primeiro" da casa:
// dor → por que nada resolveu → oferta. Pensada para as lojas de Praia Grande e Baixada.
const DORES = [
  'Chega coleção nova de legging toda semana, e cada cor precisa de uma foto no corpo para vender no Instagram.',
  'Modelo e fotógrafo a cada coleção custam mais do que a margem das peças.',
  'A cliente pergunta "como fica em mim?" no direct às 23h, e a venda esfria até de manhã.',
  'O conjunto veio em 5 cores, mas você só teve tempo de fotografar uma.',
  'Foto de manequim não mostra o caimento, e a cliente fica em dúvida entre o P e o M.',
];

interface FitnessProps {
  navigateTo: (page: Page) => void;
  onVerPlanos: () => void;
}

const Fitness: React.FC<FitnessProps> = ({ navigateTo, onVerPlanos }) => {
  const [dor, setDor] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setDor(d => (d + 1) % DORES.length), 5000);
    return () => clearInterval(t);
  }, [pausado]);

  return (
    <div className="bg-white -mx-4 -my-8">
      {/* 1. Fogo: a dor */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-violet-50 via-white to-gray-50 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-700 mb-4">Para lojas de moda fitness de Praia Grande e da Baixada</p>
        <div className="grid max-w-3xl mx-auto" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} aria-live="polite">
          {DORES.map((d, i) => (
            <h1 key={i} className={`[grid-area:1/1] text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight transition-opacity duration-500 ${i === dor ? 'opacity-100' : 'opacity-0'}`} aria-hidden={i !== dor}>
              {d}
            </h1>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {DORES.map((_, i) => (
            <button key={i} onClick={() => setDor(i)} aria-label={`Dor ${i + 1}`}
              className={`w-3 h-3 rounded-full ${i === dor ? 'bg-violet-600' : 'bg-gray-300'}`} />
          ))}
        </div>
      </section>

      {/* 2. Mecanismo: por que nada resolveu */}
      <section className="py-16 px-4 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Por que fotografar não resolve</h2>
        <p className="text-lg text-gray-600">
          Moda fitness vende pelo caimento no corpo, e o catálogo muda toda semana. Fotografar cada cor em cada modelo
          não cabe no tempo nem no bolso de uma loja de bairro. E a foto de manequim não responde a única pergunta que
          a cliente faz antes de comprar: como fica em mim.
        </p>
      </section>

      {/* 3. Oferta */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">Foto de catálogo e provador, feitos por IA</h2>
          <p className="text-gray-600 text-center mb-10">Da peça no balcão à foto no corpo, em minutos, sem estúdio.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ['/img/fitness-flat-lay.webp', '1. Fotografe a peça', 'Tire foto do conjunto em cima da mesa. A IA monta o flat lay de catálogo.', 'aspect-square'],
              ['/img/passo2-modelo-base.webp', '2. Escolha a modelo', 'Use uma modelo pronta ou a foto da sua cliente.', 'aspect-[3/4]'],
              ['/img/fitness-look.webp', '3. Pronto para postar', 'A peça vestida, com o caimento e as cores da sua coleção.', 'aspect-[3/4]'],
            ].map(([img, titulo, texto, proporcao]) => (
              <div key={titulo} className="text-center">
                <img src={img} alt={titulo} className={`rounded-lg shadow-lg w-full ${proporcao} object-cover mb-4`} loading="lazy" />
                <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
                <p className="text-gray-600">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">Sua cliente prova pelo celular</h2>
        <ul className="space-y-3 text-lg text-gray-700">
          <li>✔ Um link só da sua loja (ex.: estilovirtual.vercel.app/p/sua-loja) para colocar na bio do Instagram.</li>
          <li>✔ A cliente envia uma foto e vê o conjunto nela, na hora, a qualquer hora da noite.</li>
          <li>✔ No fim, um botão leva direto para o WhatsApp da loja.</li>
          <li>✔ Você escolhe quais peças aparecem e quantas provas por dia.</li>
        </ul>
        <p className="text-sm text-gray-400 text-center mt-4">As imagens são simulações feitas por IA: caimento e tamanho reais podem variar.</p>
      </section>

      <section className="py-16 px-4 bg-violet-700 text-white text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Teste com as peças da sua loja</h2>
        <p className="text-violet-100 mb-8">3 gerações grátis, sem cartão.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => navigateTo('flatLay')} className="bg-white text-violet-700 font-bold py-3 px-8 rounded-lg hover:bg-violet-50">Testar grátis</button>
          <button onClick={onVerPlanos} className="border-2 border-white font-bold py-3 px-8 rounded-lg hover:bg-violet-600">Ver planos</button>
        </div>
      </section>
    </div>
  );
};

export default Fitness;
