// GitHub 태그 스타일 — 채도 낮은 파스텔 계열 랜덤 생성
export const generateRandomColor = (): string => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 55 + Math.floor(Math.random() * 20); // 55~75%
  const lightness = 45 + Math.floor(Math.random() * 15);  // 45~60%
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
