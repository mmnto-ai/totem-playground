export const metadata = { title: 'Totem Playground', description: 'A broken Next.js app for testing Totem' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
