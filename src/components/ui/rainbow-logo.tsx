type Size = "sm" | "lg";

const config: Record<Size, { outer: number; bar: { w: number; h: number; r: number } }> = {
  sm: { outer: 18, bar: { w: 3, h: 8, r: 2 } },
  lg: { outer: 88, bar: { w: 14, h: 38, r: 7 } },
};

const colors = ["#815AFF", "#00B8F7", "#00CDA7", "#FFC300", "#FF6020", "#FD1549"];

export function RainbowLogo({ size = "sm" }: { size?: Size }) {
  const { outer, bar } = config[size];
  const cx = outer / 2;
  const cy = outer / 2;

  return (
    <div
      style={{ width: outer, height: outer, position: "relative", flexShrink: 0 }}
    >
      {colors.map((color, i) => {
        const angle = i * 60;
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: cx - bar.w / 2,
              top: cy - bar.h / 2,
              width: bar.w,
              height: bar.h,
              borderRadius: bar.r,
              backgroundColor: color,
              transformOrigin: `50% 50%`,
              transform: `rotate(${angle}deg) translateY(-${outer * 0.18}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
