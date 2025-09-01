import "./globals.css";

export async function generateMetadata({ params }) {
  const path = params.path;

  try {
    const response = await fetch(`https://invitation.plume7eat.xyz/metadata/${path}.json`);
    const data = await response.json();

    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.openGraph?.title,
        description: data.openGraph?.description,
        url: data.openGraph?.url,
        type: data.openGraph?.type,
        images: data.openGraph?.images
      },
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return {
      title: "모바일 청첩장",
      description: "모바일 청첩장",
      openGraph: {
        title: "모바일 청첩장",
        description: "박기웅과 권유진의 결혼식에 초대합니다.",
        url: "https://invitation.plume7eat.xyz/gy28sep2501",
        type: "website",
        images: [
          {
            url: "https://invitation.plume7eat.xyz/metadata/gy28sep2501.jpg",
            width: 1200,
            height: 630,
            alt: "모바일 청첩장",
          },
        ],
      },
    };
  }
}

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
