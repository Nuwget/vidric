'use client';

import { useState } from 'react';
import { BookmarkPlus, Copy, RotateCcw, X, ShieldCheck, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DsConfig, Snapshots, Sombra } from './defaults';
import type { ResultadoAxe } from './lib/a11y';

interface Props {
  config: DsConfig;
  snapshots: Snapshots;
  onChange: (patch: Partial<DsConfig>) => void;
  onReset: () => void;
  onExport: () => void;
  onSalvarSnapshot: (nome: string) => void;
  onAplicarSnapshot: (nome: string) => void;
  onExcluirSnapshot: (nome: string) => void;
  onRodarAxe: () => void;
  axeRodando: boolean;
  axeResultado: ResultadoAxe | null;
  onExportarRelatorio: () => void;
  onFocarViolacao: (target: string[]) => void;
}

function LinhaSlider({
  testid,
  rotulo,
  valor,
  min,
  max,
  step,
  formato,
  onChange,
}: {
  testid: string;
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  step: number;
  formato: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs">
        <Label className="font-medium">{rotulo}</Label>
        <span className="money" style={{ color: 'var(--muted)' }}>
          {formato(valor)}
        </span>
      </div>
      <Slider
        data-testid={testid}
        aria-label={rotulo}
        value={[valor]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function ControlPanel({
  config,
  snapshots,
  onChange,
  onReset,
  onExport,
  onSalvarSnapshot,
  onAplicarSnapshot,
  onExcluirSnapshot,
  onRodarAxe,
  axeRodando,
  axeResultado,
  onExportarRelatorio,
  onFocarViolacao,
}: Props) {
  const [nomeSnapshot, setNomeSnapshot] = useState('');
  const nomes = Object.keys(snapshots);

  return (
    <div data-testid="painel-controle" className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold tracking-[-0.01em]">Painel de controle</h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
          CSS vars ao vivo · salvo no navegador
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <LinhaSlider
          testid="slider-opacidade"
          rotulo="Opacidade do vidro"
          valor={config.glassOpacity}
          min={0.1}
          max={0.6}
          step={0.01}
          formato={(v) => v.toFixed(2)}
          onChange={(v) => onChange({ glassOpacity: v })}
        />
        <LinhaSlider
          testid="slider-blur"
          rotulo="Blur"
          valor={config.glassBlur}
          min={0}
          max={64}
          step={1}
          formato={(v) => `${v}px`}
          onChange={(v) => onChange({ glassBlur: v })}
        />
        <LinhaSlider
          testid="slider-saturacao"
          rotulo="Saturação"
          valor={config.glassSaturate}
          min={1}
          max={3}
          step={0.05}
          formato={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => onChange({ glassSaturate: v })}
        />
        <LinhaSlider
          testid="slider-radius"
          rotulo="Border radius"
          valor={config.radius}
          min={0}
          max={32}
          step={1}
          formato={(v) => `${v}px`}
          onChange={(v) => onChange({ radius: v })}
        />
        <LinhaSlider
          testid="slider-borda"
          rotulo="Espessura da borda"
          valor={config.borderWidth}
          min={0}
          max={2}
          step={0.25}
          formato={(v) => `${v}px`}
          onChange={(v) => onChange({ borderWidth: v })}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="select-sombra" className="text-xs font-medium">
            Sombra
          </Label>
          <Select value={config.shadow} onValueChange={(v) => onChange({ shadow: v as Sombra })}>
            <SelectTrigger id="select-sombra" data-testid="select-sombra" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="soft">Soft</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <LinhaSlider
          testid="slider-specular"
          rotulo="Intensidade do specular"
          valor={config.specular}
          min={0}
          max={1}
          step={0.05}
          formato={(v) => v.toFixed(2)}
          onChange={(v) => onChange({ specular: v })}
        />
      </div>

      <div
        className="flex flex-col gap-3 border-t pt-4"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-tema" className="text-xs font-medium">
            Tema escuro
          </Label>
          <Switch
            id="switch-tema"
            data-testid="switch-tema"
            checked={config.theme === 'dark'}
            onCheckedChange={(v) => onChange({ theme: v ? 'dark' : 'light' })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-code" className="text-xs font-medium">
            Code blocks
          </Label>
          <Switch
            id="switch-code"
            data-testid="switch-code"
            checked={config.showCode}
            onCheckedChange={(v) => onChange({ showCode: v })}
          />
        </div>
      </div>

      {/* Painel de acessibilidade (PARTE 4.6 / PARTE 7) */}
      <div
        className="flex flex-col gap-3 border-t pt-4"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
          <ShieldCheck className="size-3.5" aria-hidden /> Acessibilidade
        </p>
        <LinhaSlider
          testid="slider-font-scale"
          rotulo="Escala de fonte"
          valor={config.fontScale}
          min={100}
          max={150}
          step={25}
          formato={(v) => `${v}%`}
          onChange={(v) => onChange({ fontScale: v })}
        />
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-reduced-motion" className="text-xs font-medium">
            Simular prefers-reduced-motion
          </Label>
          <Switch
            id="switch-reduced-motion"
            data-testid="switch-reduced-motion"
            checked={config.reducedMotion}
            onCheckedChange={(v) => onChange({ reducedMotion: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="switch-contrast" className="text-xs font-medium">
            Simular prefers-contrast: more
          </Label>
          <Switch
            id="switch-contrast"
            data-testid="switch-contrast"
            checked={config.highContrast}
            onCheckedChange={(v) => onChange({ highContrast: v })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          data-testid="botao-auditar-axe"
          onClick={onRodarAxe}
          disabled={axeRodando}
        >
          {axeRodando ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
          {axeRodando ? 'Auditando…' : 'Rodar auditoria axe'}
        </Button>

        {axeResultado && (
          <div
            data-testid="resultado-axe"
            className="flex flex-col gap-2 rounded-lg p-2.5 text-xs"
            style={{ background: 'var(--glass-bg-thin)' }}
            aria-live="polite"
          >
            <p className="font-semibold">
              {axeResultado.criticoSerio === 0 ? (
                <span style={{ color: 'var(--accent-text)' }}>0 violações critical/serious ✓</span>
              ) : (
                <span style={{ color: 'var(--danger-text)' }}>{axeResultado.criticoSerio} violações critical/serious</span>
              )}
            </p>
            <p style={{ color: 'var(--muted)' }}>
              {axeResultado.passes} passes · {axeResultado.avisos.length} avisos · {axeResultado.incompletos} incompletos
            </p>
            {axeResultado.violacoes.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {axeResultado.violacoes.map((v) => (
                  <li key={v.id} className="flex flex-col gap-0.5">
                    <span
                      className="font-medium"
                      style={{ color: v.impact === 'critical' || v.impact === 'serious' ? 'var(--danger-text)' : 'var(--warning-text)' }}
                    >
                      [{v.impact}] {v.help}
                    </span>
                    {v.nodes[0] && (
                      <button
                        type="button"
                        onClick={() => onFocarViolacao(v.nodes[0].target)}
                        className="self-start rounded text-[11px] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        style={{ color: 'var(--accent-text)' }}
                      >
                        ver elemento ({v.nodes.length})
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 w-full bg-transparent"
              data-testid="botao-exportar-relatorio"
              onClick={onExportarRelatorio}
            >
              <Download data-icon="inline-start" /> Exportar relatório JSON
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 bg-transparent"
          data-testid="botao-reset-painel"
          onClick={onReset}
        >
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="botao-exportar-painel"
          onClick={onExport}
        >
          <Copy data-icon="inline-start" />
          Exportar CSS
        </Button>
      </div>

      <div
        className="flex flex-col gap-2.5 border-t pt-4"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
          Snapshots
        </p>
        <div className="flex gap-2">
          <Input
            data-testid="input-snapshot"
            value={nomeSnapshot}
            onChange={(e) => setNomeSnapshot(e.target.value)}
            placeholder="Nome (ex.: vidro-forte)"
            className="h-9"
            aria-label="Nome do snapshot"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            data-testid="botao-salvar-snapshot"
            aria-label="Salvar snapshot"
            disabled={nomeSnapshot.trim() === ''}
            onClick={() => {
              onSalvarSnapshot(nomeSnapshot.trim());
              setNomeSnapshot('');
            }}
          >
            <BookmarkPlus />
          </Button>
        </div>
        {nomes.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Nenhum snapshot salvo. Salve duas configurações para comparar.
          </p>
        ) : (
          <ul className="flex flex-col gap-1" data-testid="lista-snapshots">
            {nomes.map((nome) => (
              <li key={nome} className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid={`aplicar-snapshot-${nome}`}
                  onClick={() => onAplicarSnapshot(nome)}
                  className="flex-1 truncate rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-[var(--accent-soft)]"
                  title={`Aplicar ${nome}`}
                >
                  {nome}
                </button>
                <button
                  type="button"
                  aria-label={`Excluir snapshot ${nome}`}
                  onClick={() => onExcluirSnapshot(nome)}
                  className="grid size-6 place-items-center rounded-md"
                  style={{ color: 'var(--muted)' }}
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Defaults lidos de <span className="font-mono">theme-playground/index.html</span>. Aprovou um
        ajuste? Atualize o playground e o <span className="font-mono">globals.css</span> manualmente.
      </p>
    </div>
  );
}