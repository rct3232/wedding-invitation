# Wedding Invitation Web App

확장 가능한 청첩장 애플리케이션 프로젝트입니다.

## 시작하기

### 1. `.env` 세팅

프로젝트 루트 경로에 `.env` 파일을 생성하여 다음과 같이 변수를 입력합니다:

```env
PORT=서비스 포트
NEXT_PUBLIC_MAP_CLIENT=네이버 클라우드 지도 클라이언트 키
```

### 2. 개발 환경에서의 실행

개발 환경을 실행하려면 아래와 같은 명령어를 실행합니다:

1. Package 설치:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. 개발 환경 실행:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

### 3. `data.json` 구성

애플리케이션에서 데이터를 서빙하기위해 `/data/:query` and `/bgm/:query` API 라우터를 통하여 `data.json` 를 사용하므로 아래와 같이 설정해야합니다:

1. 프로젝트 루트 경로에 `data` 폴더 생성
2. 생성한 `data` 폴더에 `data.json` 아래와 같은 구조로 생성:

```json
{
  "invitation_data": {
    "person": [{ 
      "title": "Groom",
      "name": { "kor": { "first": "길동", "last": "홍" },
                "eng": { "first": "Gildong", "last": "Hong" }
              },
      "order": "장남",
      "parent": [{
        "title": "아버지",
        "name": "어머니",
        "bank": { "name": "가나다", "account": "1234-5678-91011" }
      }, {
        "title": "Mather",
        "name": "Jane Park"
      }],
      "bank": { "name": "가나다", "account": "1234-5678-91011", "kakao": "https://own_kakaopay_link" },
      "color": "#D9D4CF"
    }, {
      "title": "신부",
      ...생략...
    }],
    "content": {
      "date": "2099-12-31T12:00:00+0900",
      "greeting": "우리의 결혼식에 참석해주셔서 감사합니다.",
      "splashText": "we're getting married",
      "colorInvert": 1,
      "confetti": {
        "color": ["#D2691E", "#B22222", "#FF8C00", "#DAA520", "#8B4513"],
        "shape": "M0,-6 L2,-4 L5,-4 L3,-1 L4,2 L1,1 L0,6 L-1,1 L-4,2 L-3,-1 L-5,-4 L-2,-4 Z"
      }
    },
    "place": {
      "address": {
        "name": "가나다 웨딩홀",
        "address": "강남대로 99길 99"
      },
      "route": [{
          "type": "대중교통",
          "content": [ "2호선 강남역 13번 출구에서 걸어서 3분" ]
        }, {
          "type": "주차",
          "content": [ "무료 발렛" ]
        }
      ],
      "map": {
        "pos": { "lat": 37.5029539, "lng": 127.0249367 },
        "center": { "lat": 37.5007626, "lng": 127.0261111 },
        "zoom": 15
      }
    }
  }
}
```

#### `data.json` 에 대한 설명:
생략 가능이 표시되지 않은 요소는 모두 필수이며, List 요소는 반복 가능합니다.
- **`invitation_data`**: 청첩장 데이터 ID로, URL의 쿼리스트링으로 사용됨. `예시) https://your.address.invite/invitation_data`
  - `person`: 청첩장에 사용되는 인물 데이터
    - `title`: 신랑, 신부 등 인물 타이틀
    - `name`: 인물 이름
    - `order`: '장남', '아들' 과 같은 인물의 수식어
    - `parent`: 인물의 부모정보 List, `bank` 요소는 생략 가능
    - `bank`: 인물 계좌 정보
    - `color`: 계좌 정보 아코디언에 사용되는 컬러 Hex 코드
  - `content`: 오프닝 스플래시 문구, 인삿말, 헤더 문구 색상반전 등 청첩장 페이지에 사용되는 콘텐츠 데이터
    - `date`: 결혼식 일자 / yyyy-mm-ddThi24:mi:ss+timezone 형식
    - `greeting`: 인삿말
    - `splashText`: 페이지 로딩 전 스플래시 문구
    - `colorInvert`: 상단 고정 헤더 문구 색상 반전 여부 (`0`: 밝은색상 / `1`: 어두운색상)
    - `confetti`: 컨페티 효과 데이터
        - `color`: 컨페티 색상 List
        - `shape`: 컨페티 렌더링 좌표
  - `place`: 웨딩홀 장소 데이터
    - `address`: 웨딩홀 이름 및 주소
    - `route`: 웨딩홀 찾아오는길 List
        - `type`: 이동수단 종류
        - `content`: 이동수단에 따른 찾아오는길 설명 List
    - `map`: 웨딩홀 지도 데이터
        - `pos`: 위도 경도 좌표
        - `center`: 지도 중앙 좌표
        - `zoom`: 지도 확대 수

3. `data` 디렉토리 내 data id 를 이름으로 하는 폴더 생성 `예시) /data/invitation_data`
4. `data id` 디렉토리 내 `full`, `thumb` 폴더 생성 및 `header.png`, `bgm.mp3` 파일 생성

#### `data/data id` 에 대한 설명:
   - `invitation_data`은 특정 청첩장 데이터를 나타내는 ID입니다.
   - 디렉토리 구조:
     ```
     /data/invitation_data/
       ├── full/
       │     └── 01.png
       │     └── 02.png
       │     └── ...
       ├── thumb/
       │     └── thumb_01.png
       │     └── thumb_02.png
       │     └── ...
       └── header.png
       └── bgm.mp3
     ```
   - `full/01.png 등`: 갤러리에 표시되는 고해상도 원본 이미지
   - `thumbnail/thumb_01.png 등`: 썸네일용 이미지로 원본 이미지 이름 앞에 thumb_ 을 붙임
   - `header.png`: 페이지 최상단 대문 이미지
   - `bgm.mp3`: 배경 음악 파일

### 4. 프로덕션 환경 실행

프로덕션 환경에서 빌드 및 실행하려면 다음 명령어를 실행합니다:

1. 프로젝트 빌드:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

2. 백엔드를 포함한 애플리케이션 실행:
   ```bash
   npm run start
   # or
   yarn start
   # or
   pnpm start
   ```

또한, 프로젝트에 포함된 Dockerfile을 사용하여 실행할 수 있습니다.

### 5. URL Params
params을 입력하여 청첩장 페이지의 기능을 사용할 수 있습니다.

- `?mode=bm9BY2NvdW50`: 계좌 정보 미표출
---

### Additional Notes
TO-BE: query string이 아닌 url params으로 분기할 수 있도록 수정 개발 예정

제작자 청첩장: https://invitation.plume7eat.xyz/?path=gy28sep2501