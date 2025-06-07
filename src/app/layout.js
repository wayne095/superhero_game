import '../../styles/global.css'; // 退兩層就能找到根目錄 styles

export const metadata = { title: 'Pixel Hero' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}