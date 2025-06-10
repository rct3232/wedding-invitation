import Image from "next/image";
import styles from "./page.module.css";

import Map from "./modules/map.js";
import Greeting from "./modules/greeting.js"
import DateCounter from "./modules/dateCounter";
import Galley from "./modules/gallery/gallery";
import BankAccountAccordion from "./modules/bankAccountAccordion";
import Guestbook from "./modules/guestbook";

const data = {
  manName: {first: "철수", last: "김"},
  womanName: {first: "영희", last: "이"},
  date: new Date('2025-09-28T12:00:00+0900'),
  place: {name: "강남구 ABC컨벤션 123홀", address: "강남구 강남대로 99길 999-999 가나다빌딩"},
  parent: {man: {father: "홍길동", mother: "홍길순"}, woman: {father: "홍길동", mother: "홍길순"}},
  greeting: "함께 있을 때 가장 나다운 사람을 만나\n세상의 파도 앞에 나란히 서기로 했습니다\n때로는 흔들리더라도 함께 걷겠습니다\n소중한 시작, 따뜻한 발걸음으로 축복해 주세요",
  relation: [{
    parent: ["홍길동순", "홍길순"],
    title: "장남",
    name: "김철수"
  },{
    parent: ["홍길", "홍길순동"],
    title: "차녀",
    name: "이영희"
  }],
  route: [{type: "대중교통", content: ["2호선 · 분당선 강남역 하차 후\n12번 출구에서 강남99번 환승, 가나다빌딩 하차", "2호선 · 분당선 강남역 하차 후\n1번 출구에서 ABC웨딩홀 셔틀운영 (11시~13시, 15분 간격)"]}, {type: "주차", content: ["가나다빌딩 주차장 이용 (90분 무료)\n* 이후 10분당 2000원"]}],
  account: [{
    color: "#A5B8D0",
    content: [
      {title: "신랑", name:"김철수", bank: "abc은행", account: "111-222222-33333"},
      {title: "아버지", name: "홍길동순", bank: "abc은행", account: "111-222222-33333"},
      {title: "어머니", name: "홍길순", bank: "abc은행", account: "111-222222-33333"}
    ]
  },
  {
    color: "#D4A19C",
    content: [
      {title: "신부", name: "이영희", bank: "abc은행", account: "111-222222-33333"},
      {title: "아버지", name: "홍길", bank: "abc은행", account: "111-222222-33333"},
      {title: "어머니", name: "홍길순동", bank: "abc은행", account: "111-222222-33333"}
    ]
  }],
  galleryImage: {
    fullImages: [
      "00.jpg", "01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg", "06.jpg", "07.jpg", "08.jpg", "09.jpg",
      "00.jpg", "01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg", "06.jpg", "07.jpg", "08.jpg", "09.jpg"
    ],
    thumbImages: [
      "thumb_00.jpg", "thumb_01.jpg", "thumb_02.jpg", "thumb_03.jpg", "thumb_04.jpg", "thumb_05.jpg", "thumb_06.jpg", "thumb_07.jpg", "thumb_08.jpg", "thumb_09.jpg",
      "thumb_00.jpg", "thumb_01.jpg", "thumb_02.jpg", "thumb_03.jpg", "thumb_04.jpg", "thumb_05.jpg", "thumb_06.jpg", "thumb_07.jpg", "thumb_08.jpg", "thumb_09.jpg"
    ]
  }
}

const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

const clientId = '9syct7whuf';
const urlPath = 'gy28sep2501';

export default function Home() {
  return (
    <div>
      <div className={styles.page}>
        <Image src="/header_image.jpg" alt="Header picture" fill objectFit="cover" objectPosition="center"/>
        <div className={styles.container}>
          <div className={styles.headercover}/>
          <div className={styles.nametag}>
            <div className={styles.title}>{data.manName.first} 💍 {data.womanName.first}</div>
            <div className={styles.detail} style={{alignItems: 'center'}}>
              <div className={styles.little}>{data.date.getFullYear()}년 {data.date.getMonth()+1}월 {data.date.getDate()}일 {dayOfWeek[data.date.getDay()]}요일 {data.date.getHours()}:{String(data.date.getMinutes()).padStart(2, '0')}</div>
              <div className={styles.little}>{data.place.name}</div>
            </div>
          </div>
          <main className={styles.main}>
            <div className={styles.divider}/>
            <Greeting greeting={data.greeting} relation={data.relation}/>
            <div className={styles.divider}/>

            <div className={styles.content}>
            <DateCounter date={data.date}/>
            </div>

            <Galley fullImages={data.galleryImage.fullImages} thumbImages={data.galleryImage.thumbImages}/>

            <div className={styles.divider}/>

            <div className={styles.header}>오시는 길</div>
            <div className={styles.detail}>
              <Map clientId={clientId}/>
              <div className={styles.little} style={{marginLeft: 'auto'}}>{data.place.address}</div>
            </div>
            <div className={styles.content}>
              <div className={styles.body}>{data.route[0].type}</div>
              <div className={styles.detail}>
                <div className={styles.little} style={{whiteSpace : "pre-wrap"}}>{data.route[0].content[0]}</div>
                <div className={styles.little} style={{whiteSpace : "pre-wrap"}}>{data.route[0].content[1]}</div>
              </div>
              <div className={styles.body}>{data.route[1].type}</div>
              <div className={styles.detail}>
                <div className={styles.little} style={{whiteSpace : "pre-wrap"}}>{data.route[1].content[0]}</div>
              </div>
            </div>

            <div className={styles.divider}/>
            <BankAccountAccordion accountInfo={data.account}/>
            <div className={styles.divider}/>
            <Guestbook urlPath={urlPath}/>

          </main>
          <footer className={styles.footer}>
            <p style={{color: 'white', fontSize: 'xx-small', textAlign: 'center'}}>e-mail: rct3232@gmail.com</p>
          </footer>
        </div>
      </div>
    </div>
  );
}