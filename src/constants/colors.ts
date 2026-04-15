// 다크 화면 최적화 — 채도를 낮추고 밝기를 높여 눈에 편한 색상 생성
export const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 30 + Math.floor(Math.random() * 20); // 30~50% (낮은 채도)
  const lightness = 60 + Math.floor(Math.random() * 15);  // 60~75% (높은 밝기)
  return hslToHex(hue, saturation, lightness);
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
