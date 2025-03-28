import Image from "next/image";
import styles from "./page.module.css";
import Map from "./map.js";

const data = {
  manName: {first: "철수", last: "김"},
  womanName: {first: "영희", last: "이"},
  date: {year: 9999, month: 99, day: 99, dayOfWeek: "일", hour: "99", minute: "99"},
  place: {name: "강남구 ABC컨벤션 123홀", address: "강남구 강남대로 99길 999-999 가나다빌딩"},
  parent: {man: {father: "홍길동", mother: "홍길순"}, woman: {father: "홍길동", mother: "홍길순"}},
  greeting: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam congue magna a orci scelerisque, ut feugiat est gravida. Cras vehicula, urna a iaculis aliquet, lacus sapien semper odio, vel hendrerit orci augue quis purus. Suspendisse varius blandit ligula, a pretium lorem bibendum nec.",
  route: [{type: "대중교통", content: ["2호선 · 분당선 강남역 하차 후\n12번 출구에서 강남99번 환승, 가나다빌딩 하차", "2호선 · 분당선 강남역 하차 후\n1번 출구에서 ABC웨딩홀 셔틀운영 (11시~13시, 15분 간격)"]}, {type: "주차", content: ["가나다빌딩 주차장 이용 (90분 무료)\n* 이후 10분당 2000원"]}],
  account: {man: {self: {bank: "abc은행", account: "111-222222-33333"}, father: {bank: "abc은행", account: "111-222222-33333"}, mother: {bank: "abc은행", account: "111-222222-33333"}}, woman: {self: {bank: "abc은행", account: "111-222222-33333"}, father: {bank: "abc은행", account: "111-222222-33333"}, mother: {bank: "abc은행", account: "111-222222-33333"}}}
}

const dDayCount = {
  day: 9999, hour: 99, minute: 99, second: 99
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Image src="/header_image.jpg" alt="Header picture" fill objectFit="cover" objectPosition="center"/>
      <div className={styles.container}>
        <div className={styles.headercover}/>
        <div className={styles.nametag}>
          <div className={styles.title}>{data.manName.first} 💍 {data.womanName.first}</div>
          <div className={styles.detail} style={{alignItems: 'center'}}>
            <div className={styles.little}>{data.date.year}년 {data.date.month}월 {data.date.day}일 {data.date.dayOfWeek}요일 {data.date.hour}:{data.date.minute}</div>
            <div className={styles.little}>{data.place.name}</div>
          </div>
        </div>
        <main className={styles.main}>

          <div className={styles.divider}/>

          <div className={styles.body} style={{textAlign: 'center', lineHeight: 2}}>{data.greeting}</div>
          <div className={styles.detail}>
            <div className={styles.body} style={{textAlign: 'center'}}>{data.parent.man.father} · {data.parent.man.mother}의 아들
              <span className={styles.body} style={{fontWeight: 'bold'}}> {data.manName.last}{data.manName.first}</span>
            </div>
            <div className={styles.body} style={{textAlign: 'center'}}>{data.parent.woman.father} · {data.parent.woman.mother}의 딸
              <span className={styles.body} style={{fontWeight: 'bold'}}> {data.womanName.last}{data.womanName.first}</span>
            </div>
          </div>
          <Image src="/flower.png" alt="flower image" width="82" height="124" style={{margin: "auto"}}/>

          <div className={styles.divider}/>

          <div className={styles.content}>
            <div className={styles.header}>결혼식 까지</div>
            <div className={styles.datecounter}>
              <div className={styles.dateelement}>
                <p style={{fontWeight: 'bold', fontSize: '20px'}}>{dDayCount.day}</p><p className={styles.body}>일</p>
              </div>
              <div className={styles.dateelement}>
                <p style={{fontWeight: 'bold', fontSize: '20px'}}>{dDayCount.hour}</p><p className={styles.body}>시간</p>
              </div>
              <div className={styles.dateelement}>
                <p style={{fontWeight: 'bold', fontSize: '20px'}}>{dDayCount.minute}</p><p className={styles.body}>분</p>
              </div>
              <div className={styles.dateelement}>
                <p style={{fontWeight: 'bold', fontSize: '20px'}}>{dDayCount.second}</p><p className={styles.body}>초</p>
              </div>
            </div>
          </div>

          <div className={styles.gallery}>
            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>

            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>

            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>

            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>
            <div className={styles.galleryPhoto}></div>
          </div>
          <a className={styles.body} style={{textDecoration: 'underline', fontWeight: 'bold', margin: 'auto'}} href="/">더보기</a>

          <div className={styles.divider}/>

          <div className={styles.header}>오시는 길</div>
          <div className={styles.detail}>
            <Map/>
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

          <div className={styles.header}>마음 전하실 곳</div>
          <div className={styles.bankAccount} style={{backgroundColor: '#889EB0'}}>
            <div className={styles.banner}>
              <div className={styles.little} style={{marginRight: 'auto'}}>신랑측 계좌번호</div>
              <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/accordion.png" fill objectFit="cover" objectPosition="center"/></div>
            </div>
            <div className={styles.body}>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>신랑 {data.manName.last}{data.manName.first}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.man.self.bank} {data.account.man.self.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>아버지 {data.parent.man.father}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.man.father.bank} {data.account.man.father.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>어머니 {data.parent.man.mother}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.man.mother.bank} {data.account.man.mother.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
            </div>
          </div>
          <div className={styles.bankAccount} style={{backgroundColor: '#C39898'}}>
            <div className={styles.banner}>
              <div className={styles.little} style={{marginRight: 'auto'}}>신부측 계좌번호</div>
              <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/accordion.png" fill objectFit="cover" objectPosition="center"/></div>
            </div>
            <div className={styles.body}>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>신랑 {data.womanName.last}{data.womanName.first}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.woman.self.bank} {data.account.woman.self.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>아버지 {data.parent.woman.father}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.woman.father.bank} {data.account.woman.father.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
              <div className={styles.row}>
                <div className={styles.little} style={{fontWeight: 'bold'}}>어머니 {data.parent.woman.mother}</div>
                <div className={styles.little} style={{marginLeft: 'auto'}}>{data.account.woman.mother.bank} {data.account.woman.mother.account}</div>
                <div style={{position: 'relative', alignItems: 'stretch', aspectRatio: '1 / 1'}}><Image src="/copy.png" fill objectFit="cover" objectPosition="center"/></div>
              </div>
            </div>
          </div>

          <div className={styles.divider}/>

          <div className={styles.header}>전하고 싶은 말</div>
          <div className={styles.content}>
            <textarea className={styles.guestbook} maxLength="183" placeholder="방명록을 남겨주세요"/>
            <input className={styles.guestbook} placeholder="이름"/>
          </div>
          <a className={styles.body} style={{textDecoration: 'underline', fontWeight: 'bold', margin: 'auto'}} href="/">등록</a>
        </main>
        <footer className={styles.footer}>
          <p style={{color: 'white', fontSize: 'xx-small', textAlign: 'center'}}>e-mail: rct3232@gmail.com</p>
        </footer>
      </div>
    </div>
  );
}