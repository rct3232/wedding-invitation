import "./globals.css";

export const metadata = {
  title: "모바일 청첩장",
  description: "모바일 청첩장",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
