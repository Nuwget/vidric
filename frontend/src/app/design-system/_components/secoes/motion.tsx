'use client';

import { useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '../code-block';
import { Grupo, ShowcaseSection } from '../showcase-section';

interface Animacao {
  id: string;
  nome: string;
  uso: string;
  dur: string;
  bezier: [number, number, number, number];
  keyframe: string;
}

const ANIMACOES: Animacao[] = [
  { id: 'spring', nome: 'Spring standard', uso: 'Entrada de modal', dur: '200ms', bezier: [0.34, 1.56, 0.64, 1], keyframe: 'ds-anim-spring' },
  { id: 'lift', nome: 'Hover lift', uso: 'Cards e botões', dur: '150ms', bezier: [0.4, 0, 0.2, 1], keyframe: 'ds-anim-lift' },
  { id: 'press', nome: 'Press scale', uso: 'Feedback de clique', dur: '100ms', bezier: [0.4, 0, 0.2, 1], keyframe: 'ds-anim-press' },
  { id: 'fade', nome: 'Fade in', uso: 'Aparição de conteúdo', dur: '180ms', bezier: [0, 0, 0.2, 1], keyframe: 'ds-anim-fade' },
];

const MOTION_CSS = `
@keyframes ds-anim-spring { 0% { opacity: 0; transform: translateY(14px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ds-anim-lift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
@keyframes ds-anim-press { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.97); } }
@keyframes ds-anim-fade { 0% { opacity: 0.15; } 100% { opacity: 1; } }
.ds-motion-card .ds-motion-alvo { animation-iteration-count: infinite; animation-fill-mode: both; }
.ds-motion-card:hover .ds-motion-alvo,
.ds-motion-card:focus-within .ds-motion-alvo,
.ds-motion-card[data-playing="true"] .ds-motion-alvo {
  animation-name: var(--ds-anim);
  animation-duration: var(--ds-dur);
  animation-timing-function: var(--ds-ease);
}
`;

function CurvaBezier({ pontos }: { pontos: [number, number, number, number] }) {
  const [x1, y1, x2, y2] = pontos;
  const X = (v: number) => 10 + v * 100;
  const Y = (v: number) => 110 - v * 100;
  const d = `M ${X(0)} ${Y(0)} C ${X(x1)} ${Y(y1)}, ${X(x2)} ${Y(y2)}, ${X(1)} ${Y(1)}`;
  return (
    <svg viewBox="0 -50 120 170" className="h-24 w-full" role="img" aria-label={`Curva cubic-bezier(${pontos.join(', ')})`}>
      <rect x="10" y="10" width="100" height="100" fill="none" stroke="var(--glass-border)" strokeWidth="1" />
      <line x1="10" y1="110" x2="110" y2="10" stroke="var(--glass-border)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={X(0)} y1={Y(0)} x2={X(x1)} y2={Y(y1)} stroke="var(--muted)" strokeWidth="1" />
      <line x1={X(1)} y1={Y(1)} x2={X(x2)} y2={Y(y2)} stroke="var(--muted)" strokeWidth="1" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx={X(x1)} cy={Y(y1)} r="3" fill="var(--accent-text)" />
      <circle cx={X(x2)} cy={Y(y2)} r="3" fill="var(--accent-text)" />
    </svg>
  );
}

function CardAnimacao({ a }: { a: Animacao }) {
  const [toando, setToando] = useState(false);
  const ease = `cubic-bezier(${a.bezier.join(', ')})`;
  const vars = { '--ds-anim': a.keyframe, '--ds-dur': a.dur, '--ds-ease': ease } as CSSProperties;
  return (
    <div
      className="ds-motion-card glass-card flex flex-col gap-3 p-4"
      data-playing={toando}
      data-testid={`motion-${a.id}`}
      style={vars}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{a.nome}</h3>
        <span className="money font-mono text-[11px]" style={{ color: 'var(--accent-text)' }}>{a.dur}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{a.uso}</p>
      <CurvaBezier pontos={a.bezier} />
      <p className="truncate font-mono text-[10px] text-muted-foreground" title={ease}>{ease}</p>
      <div className="grid h-24 place-items-center overflow-hidden rounded-xl" style={{ background: 'var(--glass-bg-thin)' }}>
        <div
          className="ds-motion-alvo grid h-14 w-28 place-items-center rounded-xl text-xs font-semibold"
          style={{ background: 'var(--accent-soft)', color: 'var(--fg)', border: '1px solid var(--glass-border)' }}
        >
          {a.nome}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full bg-transparent"
        aria-pressed={toando}
        data-testid={`play-${a.id}`}
        onClick={() => setToando((v) => !v)}
      >
        {toando ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
        {toando ? 'Pausar' : 'Play'}
      </Button>
    </div>
  );
}

export function SecaoMotion() {
  return (
    <ShowcaseSection
      id="secao-motion"
      numero="04 · Fundação"
      titulo="Motion"
      descricao="Animações reais em loop. Passe o mouse, foque o card ou use Play. Springs para entrada; ease-out para micro-interações. prefers-reduced-motion desliga tudo."
    >
      <style>{MOTION_CSS}</style>

      <Grupo rotulo="Biblioteca de movimento">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ANIMACOES.map((a) => (
            <CardAnimacao key={a.id} a={a} />
          ))}
        </div>
      </Grupo>

      <Grupo rotulo="Movimento reduzido">
        <p className="text-sm text-muted-foreground">
          Com <code className="font-mono text-xs">@media (prefers-reduced-motion: reduce)</code> — ou o toggle
          “Simular prefers-reduced-motion” no painel — todas as animações e transições são reduzidas a um
          instante. O conteúdo permanece funcional; apenas o movimento some. Nenhuma animação em loop roda
          fora desta seção.
        </p>
      </Grupo>

      <CodeBlock
        codigo={`/* Entrada de modal — spring com overshoot */
.modal { animation: spring-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1); }
/* Micro-interações */
.card:hover { transform: translateY(-1px); transition: 150ms cubic-bezier(0.4, 0, 0.2, 1); }
.btn:active { transform: scale(0.97); transition: 100ms; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}`}
      />
    </ShowcaseSection>
  );
}