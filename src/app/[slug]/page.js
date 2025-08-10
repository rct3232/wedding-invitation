// [slug]/page.js
import ClientPage from './page.client';

export const dynamic = "force-dynamic";

// 동적 메타데이터 생성 (서버 컴포넌트 입ㄴ다)
export async function generateMetadata({ params }) {
  const slug = params.slug;
  
  // 경로별 메타데이터 설정
  const metadataConfig = {
    default: {
      title: "모바일 청첩장",
      description: "박기웅과 권유진의 결혼식에 초대합니다.",
      openGraph: {
        title: "모바일 청첩장",
        description: "박기웅과 권유진의 결혼식에 초대합니다.",
        url: `https://invitation.plume7eat.xyz/${slug}`,
        type: "website",
        images: [
          {
            url: `https://invitation.plume7eat.xyz/header/${slug}.jpg`,
            width: 1200,
            height: 630,
            alt: "모바일 청첩장",
          },
        ],
      },
    },
    gy28sep2501: {
      title: "모바일 청첩장",
      description: "박기웅과 권유진의 결혼식에 초대합니다.",
      openGraph: {
        title: "모바일 청첩장",
        description: "박기웅과 권유진의 결혼식에 초대합니다.",
        url: `https://invitation.plume7eat.xyz/${slug}`,
        type: "website",
        images: [
          {
            url: `https://invitation.plume7eat.xyz/header/${slug}.jpg`,
            width: 1200,
            height: 630,
            alt: "모바일 청첩장",
          },
        ],
      },
    },

    // 아래처럼 사용하시면 됩니다.
    test: {
      title: "테스트 청첩장",
      description: "AAA에 초대합니다.",
      openGraph: {
        title: "테스트 청첩장",
        description: "AAA에 초대합니다.",
        url: `https://invitation.plume7eat.xyz/${slug}`,
        type: "website",
        images: [
          {
            url: `https://invitation.plume7eat.xyz/header/${slug}.jpg`,
            width: 1200,
            height: 630,
            alt: "테스트 청첩장",
          },
        ],
      },
    },
  };

  return metadataConfig[slug] || metadataConfig.default;
}

export default function Home() {
  return <ClientPage />;
}
