// colorAliasMapping.ts
export type ChartBarColor = 'lightblue' | 'blue' | 'purple' | 'pink' | 'red' | 'yellow' | 'green';
const chartBarColors: ChartBarColor[] = ['lightblue', 'blue', 'purple', 'pink', 'red', 'yellow', 'green'];

export type AliasMapping = {
  [color in ChartBarColor]?: string;
};

export function convertAliasToChartBarColor(alias: string, mapping: AliasMapping): ChartBarColor | undefined {
  for (const [color, mappedAlias] of Object.entries(mapping)) {
    if (mappedAlias && mappedAlias === alias) {

      return color as ChartBarColor;
    }
  }
  if (chartBarColors.includes(alias as ChartBarColor)) {
    return alias as ChartBarColor;
  }
  return 'green';
}