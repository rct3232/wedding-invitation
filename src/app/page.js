import "./globals.css";
import ClientPage from './client';

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const path = searchParams?.path;
  try {
    const response = await fetch(`${process.env.SERVICE_URL}/metadata.json`);
    const data = await response.json()[path];

    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
        url: `${process.env.SERVICE_URL}/?path=${path}`,
        type: data.openGraph?.type,
        images: {
          url: `${process.env.SERVICE_URL}/meta_${path}.jpg`,
          width: 1200,
          height: 630,
          alt: "모바일 청첩장"
        }
      },
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return {
      title: "모바일 청첩장",
      description: "데이터 불러오기 실패",
      openGraph: {
        title: "모바일 청첩장",
        description: "데이터 불러오기 실패",
        url: process.env.SERVICE_URL,
        type: "website",
        images: [
          {
            url: `${process.env.SERVICE_URL}/meta_fallback.jpg`,
            width: 1200,
            height: 630,
            alt: "모바일 청첩장",
          },
        ],
      },
    };
  }
}

export default function Home() {
  return <ClientPage />;
}