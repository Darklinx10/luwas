export function normalizeSusceptibility(value) {
  if (!value || typeof value !== 'string') return 'Unknown';

  const val = value.toLowerCase();

  if (val.includes('high')) return 'High Susceptibility';
  if (val.includes('moderate')) return 'Moderate Susceptibility';
  if (val.includes('low') || val.includes('least')) return 'Low Susceptibility';
  if (val.includes('general')) return 'Generally Susceptible';

  return 'Unknown';
}

export function formatSusceptibility(sus) {
  const normalized = normalizeSusceptibility(sus);
  const colorMap = {
    'High Susceptibility': 'text-red-700',
    'Moderate Susceptibility': 'text-purple-700',
    'Low Susceptibility': 'text-yellow-600',
    'Generally Susceptible': 'text-orange-700',
    'Unknown': 'text-gray-500',
  };

  return <span className={`font-semibold ${colorMap[normalized]}`}>{normalized}</span>;
}
