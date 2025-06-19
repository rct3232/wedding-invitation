import "./globals.css";

export const metadata = {
  title: "모바일 청첩장",
  description: "모바일 청첩장",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
