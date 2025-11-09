export const metadata = {
  title: 'WB Low Stock Finder',
  description: '????? ??????? Wildberries ?? ?????? ????????',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#0b0f14', color: '#e6edf3', margin: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
          <h1 style={{ fontSize: 28, margin: '8px 0 16px' }}>WB Low Stock Finder</h1>
          <div style={{ border: '1px solid #283042', borderRadius: 12, padding: 16, background: '#0f1621' }}>
            {children}
          </div>
          <footer style={{ opacity: 0.7, marginTop: 16, fontSize: 12 }}>???????? ?? ????????? API-???????? ? Wildberries</footer>
        </div>
      </body>
    </html>
  );
}
