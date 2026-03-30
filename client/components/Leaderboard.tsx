interface Entry {
  playerName: string;
  score: number;
  createdAt: string;
}

export function Leaderboard({ entries, title = '리더보드' }: { entries: Entry[]; title?: string }) {
  return (
    <div style={{ width: '100%', maxWidth: 500 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {entries.length === 0 ? (
        <p style={{ color: '#888' }}>아직 기록이 없습니다</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444', color: '#aaa', fontSize: 14 }}>
              <th style={{ padding: '8px 4px', textAlign: 'left', width: 40 }}>#</th>
              <th style={{ padding: '8px 4px', textAlign: 'left' }}>이름</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>점수</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px 4px', color: i < 3 ? '#ffd700' : '#aaa' }}>{i + 1}</td>
                <td style={{ padding: '8px 4px' }}>{e.playerName}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {e.score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
