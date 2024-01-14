// colorAliasMapping.ts
export type ChartBarColor = string;

export type AliasMapping = {
  [color in ChartBarColor]?: string;
};

export function convertAliasToChartBarColor(alias: string, mapping: AliasMapping): ChartBarColor {
  if (isValidColorCode(alias)) { // isValidColorCode はカラーコードが有効かどうかをチェックする関数
    return alias;
  }
  for (const [color, mappedAlias] of Object.entries(mapping)) {
    if (mappedAlias && mappedAlias === alias) {
      return color;
    }
  }
  return '#76ff7051'; // デフォルトのフォールバックカラー
}

function isValidColorCode(color: string): boolean {
  // 正規表現で16進数のカラーコード（#RRGGBB または #RRGGBBAA 形式）をチェック
  const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$|^#(?:[0-9a-fA-F]{4}){1,2}$/;
  return hexColorRegex.test(color);
}