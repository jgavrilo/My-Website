// Minimal root App Router layout — only applies to routes in the app/ directory.
// The portfolio (pages/) uses pages/_app.tsx and pages/_document.tsx instead.
export default function RootAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
