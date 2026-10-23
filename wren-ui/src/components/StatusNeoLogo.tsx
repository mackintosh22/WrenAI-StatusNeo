interface Props {
  height?: number;
  showWren?: boolean;
}

// StatusNeo wordmark (text based, no remote asset dependency)
export default function StatusNeoLogo({
  height = 22,
  showWren = false,
}: Props) {
  return (
    <span
      className="sn-logo"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        height,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      <svg
        width={height}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,214,0,.55))' }}
      >
        <path
          d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z"
          stroke="#ffd600"
          strokeWidth="1.6"
        />
        <path d="M7.5 14.5 12 6l4.5 8.5H7.5Z" fill="#ffd600" />
      </svg>
      <span
        style={{
          fontFamily: '"Space Grotesk", Inter, sans-serif',
          fontWeight: 700,
          fontSize: height * 0.72,
          letterSpacing: '0.14em',
          color: '#fff',
        }}
      >
        STATUS<span style={{ color: '#ffd600' }}>NEO</span>
      </span>
      {showWren && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: height * 0.48,
            letterSpacing: '0.14em',
            color: '#8c8c8c',
            borderLeft: '1px solid #3a3a3a',
            paddingLeft: 10,
            textTransform: 'uppercase',
          }}
        >
          × Wren AI
        </span>
      )}
    </span>
  );
}
