const styles: Record<string, { border: string; bg: string }> = {
  tip: { border: "#2A9D8F", bg: "#f0f0ed" },
  warning: { border: "#F4A261", bg: "#fdf8f3" },
  info: { border: "#6E6E6D", bg: "#f0f0ed" },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "tip" | "warning" | "info";
  children: React.ReactNode;
}) {
  const s = styles[type] ?? styles.info;

  return (
    <aside
      className="my-6 rounded-sm px-5 py-4 text-[15px] leading-[1.6]"
      style={{
        borderLeft: `3px solid ${s.border}`,
        backgroundColor: s.bg,
      }}
    >
      {children}
    </aside>
  );
}
