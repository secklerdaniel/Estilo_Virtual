import React, { useEffect, useState } from 'react';
import { api } from '../services/auth';

// Painel de uso (/painel): para onde estão indo os créditos do lojista.
type Uso = {
  limite: number;
  usados: number;
  inicio: string | null;
  fim: string | null;
  porTipo: { origem: 'app' | 'provador'; tipo: string; total: number }[];
  porDia: { dia: string; app: number; provador: number }[];
  recentes: { origem: 'app' | 'provador'; tipo: string; created_at: string }[];
  loja: { slug: string; provador_ativo: boolean; limite_diario: number; provas_hoje: number } | null;
};

const NOME: Record<string, string> = { flatLay: 'Flat lay', baseModel: 'Modelo base', tryOn: 'Provador', pose: 'Nova pose' };
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

const Cartao: React.FC<{ titulo: string; valor: React.ReactNode; detalhe?: string }> = ({ titulo, valor, detalhe }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <p className="text-sm text-gray-500">{titulo}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
    {detalhe && <p className="text-sm text-gray-500 mt-1">{detalhe}</p>}
  </div>
);

const Painel: React.FC<{ onVerPlanos: () => void }> = ({ onVerPlanos }) => {
  const [uso, setUso] = useState<Uso | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { api<Uso>('uso').then(setUso).catch(e => setErro(e.message)); }, []);

  if (erro) return <p className="text-red-600">{erro}</p>;
  if (!uso) return <p className="text-gray-500">Carregando…</p>;

  const restantes = Math.max(0, uso.limite - uso.usados);
  const pct = uso.limite ? Math.min(100, Math.round((uso.usados / uso.limite) * 100)) : 0;
  const totalApp = uso.porTipo.filter(t => t.origem === 'app').reduce((s, t) => s + t.total, 0);
  const totalProvador = uso.porTipo.filter(t => t.origem === 'provador').reduce((s, t) => s + t.total, 0);
  // Ritmo: créditos por dia no período, para estimar se dura até a renovação.
  const dias = uso.inicio ? Math.max(1, (Date.now() - new Date(uso.inicio).getTime()) / 86400000) : null;
  const ritmo = dias ? uso.usados / dias : null;
  const diasAteFim = uso.fim ? Math.max(0, (new Date(uso.fim).getTime() - Date.now()) / 86400000) : null;
  const acabaAntes = ritmo && diasAteFim !== null && ritmo * diasAteFim > restantes;

  // Gráfico: últimos 30 dias, um dia por barra (dias sem uso aparecem vazios).
  const hoje = new Date();
  const serie = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - (29 - i));
    const dia = d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const r = uso.porDia.find(x => x.dia === dia);
    return { dia, app: r?.app ?? 0, provador: r?.provador ?? 0 };
  });
  const maxDia = Math.max(1, ...serie.map(s => s.app + s.provador));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel de uso</h1>
        <p className="text-gray-600">
          {uso.inicio ? `Período de ${data(uso.inicio)} a ${data(uso.fim!)}.` : 'Créditos grátis (não expiram).'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Cartao titulo="Créditos restantes" valor={restantes} detalhe={`de ${uso.limite} no período`} />
        <Cartao titulo="Usados no período" valor={uso.usados} detalhe={`${pct}% do plano`} />
        <Cartao titulo="Por você no app" valor={totalApp} detalhe="flat lays, modelos, provas e poses" />
        <Cartao titulo="Pelas clientes" valor={totalProvador} detalhe="no provador público da loja" />
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${pct > 85 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }} />
        </div>
        {acabaAntes ? (
          <p className="text-sm text-red-600 mt-3">
            No ritmo atual (~{ritmo!.toFixed(1)} por dia), os créditos acabam antes da renovação.{' '}
            <button onClick={onVerPlanos} className="underline font-semibold">Ver planos</button>
          </p>
        ) : ritmo ? (
          <p className="text-sm text-gray-500 mt-3">Ritmo atual: ~{ritmo.toFixed(1)} crédito(s) por dia. Deve durar até a renovação.</p>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-900 mb-4">Últimos 30 dias</h2>
          <div className="flex items-end gap-1 h-40" role="img" aria-label="Créditos gastos por dia nos últimos 30 dias">
            {serie.map(s => (
              <div key={s.dia} className="flex-1 flex flex-col justify-end h-full group relative" title={`${s.dia.split('-').reverse().join('/')}: ${s.app} no app, ${s.provador} pelas clientes`}>
                <div className="bg-emerald-500 rounded-t" style={{ height: `${(s.provador / maxDia) * 100}%` }} />
                <div className={`bg-indigo-500 ${s.provador ? '' : 'rounded-t'}`} style={{ height: `${(s.app / maxDia) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{serie[0].dia.split('-').reverse().slice(0, 2).join('/')}</span>
            <span>hoje</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-600 mt-3">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-sm" />Você no app</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm" />Clientes no provador</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-gray-900 mb-4">Por tipo, no período</h2>
          {uso.porTipo.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum crédito usado ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...uso.porTipo].sort((a, b) => b.total - a.total).map(t => (
                <li key={t.origem + t.tipo} className="flex justify-between">
                  <span className="text-gray-700">{NOME[t.tipo] ?? t.tipo}{t.origem === 'provador' && <span className="text-emerald-600"> (clientes)</span>}</span>
                  <span className="font-semibold">{t.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-gray-900 mb-4">Provador público hoje</h2>
          {!uso.loja ? (
            <p className="text-sm text-gray-500">Crie sua loja em Minha conta para suas clientes provarem pelo celular.</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">{uso.loja.provas_hoje} <span className="text-base font-normal text-gray-500">de {uso.loja.limite_diario} provas</span></p>
              <p className="text-sm mt-1">
                {uso.loja.provador_ativo
                  ? <span className="text-green-700">Ligado em /p/{uso.loja.slug}</span>
                  : <span className="text-amber-700">Desligado</span>}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-gray-900 mb-4">Últimos usos</h2>
          {uso.recentes.length === 0 ? (
            <p className="text-sm text-gray-500">Nada ainda.</p>
          ) : (
            <ul className="divide-y text-sm">
              {uso.recentes.map((r, i) => (
                <li key={i} className="flex justify-between py-1.5">
                  <span>{NOME[r.tipo] ?? r.tipo}{r.origem === 'provador' && <span className="text-emerald-600"> (cliente)</span>}</span>
                  <span className="text-gray-500">{new Date(r.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Painel;
