// colorAliasMapping.ts
export type ChartBarColor = string;

export type AliasMapping = {
  [color in ChartBarColor]?: string;
};

export function convertAliasToChartBarColor(alias: string, mapping: AliasMapping): ChartBarColor {
  if (isValidColorCode(alias)) {
    return alias;
  }
  for (const [color, mappedAlias] of Object.entries(mapping)) {
    if (mappedAlias && mappedAlias === alias) {
      return color;
    }
  }
  return '#76ff7051';
}

function isValidColorCode(color: string): boolean {
  const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$|^#(?:[0-9a-fA-F]{4}){1,2}$/;
  return hexColorRegex.test(color);
}