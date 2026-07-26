'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { FinancialStatement } from '@/lib/api';

function formatY(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function formatTooltip(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)} M€`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} k€`;
  return `${sign}${abs.toLocaleString('fr-FR')} €`;
}

interface RevenueChartProps {
  statements: FinancialStatement[];
}

export function RevenueChart({ statements }: RevenueChartProps) {
  const data = [...statements]
    .sort((a, b) => a.fiscalYear - b.fiscalYear)
    .map((fs) => ({
      year: String(fs.fiscalYear),
      ca: fs.revenue ?? 0,
    }));

  if (data.length === 0) return <p className="text-sm text-gray-400">Aucune donnée</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11 }} width={55} />
        <Tooltip
          formatter={(v) => [formatTooltip(v as number), 'Chiffre d\'affaires']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="ca" fill="#3b5bdb" radius={[4, 4, 0, 0]} name="CA" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface NetIncomeChartProps {
  statements: FinancialStatement[];
}

export function NetIncomeChart({ statements }: NetIncomeChartProps) {
  const data = [...statements]
    .sort((a, b) => a.fiscalYear - b.fiscalYear)
    .map((fs) => ({
      year: String(fs.fiscalYear),
      result: fs.netIncome ?? 0,
      positive: (fs.netIncome ?? 0) >= 0,
    }));

  if (data.length === 0) return <p className="text-sm text-gray-400">Aucune donnée</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11 }} width={55} />
        <ReferenceLine y={0} stroke="#aaa" strokeWidth={1} />
        <Tooltip
          formatter={(v) => [formatTooltip(v as number), 'Résultat net']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar
          dataKey="result"
          radius={[4, 4, 0, 0]}
          name="Résultat net"
          fill="#2f9e44"
          // Colorisation conditionnelle gérée côté Cell si nécessaire
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
