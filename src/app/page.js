import Image from "next/image";
import Script from "next/script";
import styles from "./page.module.css";

const data = {
  manName: "철수",
  womanName: "영희",
  date: {year: 9999, month: 99, day: 99, dayOfWeek: "일", hour: "99", minute: "99"},
  place: {name: "강남구 ABC컨벤션 123홀"},
  parent: {man: {father: "홍길동", mother: "홍길순"}, woman: {father: "홍길동", mother: "홍길순"}},
  greeting: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam congue magna a orci scelerisque, ut feugiat est gravida. Cras vehicula, urna a iaculis aliquet, lacus sapien semper odio, vel hendrerit orci augue quis purus. Suspendisse varius blandit ligula, a pretium lorem bibendum nec."
}

const dDayCount = {
  day: 9999, hour: 99, minute: 99, second: 99
}

const clientId = '75k8dd7zkm';

export default function Home() {
  return (
    <div className={styles.page}>

      <Image src="/header_image.jpg" alt="Header picture" fill objectFit="cover" objectPosition="center"/>
      <div className={styles.container}>
        <div className={styles.headercover}/>
        <div className={styles.nametag}>
          <div className={styles.title}>{data.manName} 💍 {data.womanName}</div>
          <div className={styles.content} style={{alignItems: 'center'}}>
            <div className={styles.little}>{data.date.year}년 {data.date.month}월 {data.date.day}일 {data.date.dayOfWeek}요일 {data.date.hour}:{data.date.minute}</div>
            <div className={styles.little}>{data.place.name}</div>
          </div>
        </div>
        <main className={styles.main}>

          <div className={styles.divider}/>

          <div className={styles.body} style={{textAlign: 'center', lineHeight: 2}}>{data.greeting}</div>
          <div className={styles.content}>
            <div className={styles.body} style={{textAlign: 'center'}}>{data.parent.man.father} · {data.parent.man.mother}의 아들
              <span className={styles.body} style={{fontWeight: 'bold'}}> {data.manName}</span>
            </div>
            <div className={styles.body} style={{textAlign: 'center'}}>{data.parent.woman.father} · {data.parent.woman.mother}의 딸
              <span className={styles.body} style={{fontWeight: 'bold'}}> {data.womanName}</span>
            </div>
          </div>
          <Image src="/flower.png" alt="flower image" width="82" height="124" style={{margin: "auto"}}/>

          <div className={styles.divider}/>

          <div className={styles.content}>
            <div className={styles.body}>결혼식 까지</div>
            <div className={styles.datecounter}>
              <div className={styles.dateelement}>
                <p className={styles.header} style={{fontWeight: 'bold'}}>{dDayCount.day}</p><p className={styles.body}>일</p>
              </div>
              <div className={styles.dateelement}>
                <p className={styles.header} style={{fontWeight: 'bold'}}>{dDayCount.hour}</p><p className={styles.body}>시간</p>
              </div>
              <div className={styles.dateelement}>
                <p className={styles.header} style={{fontWeight: 'bold'}}>{dDayCount.minute}</p><p className={styles.body}>분</p>
              </div>
              <div className={styles.dateelement}>
                <p className={styles.header} style={{fontWeight: 'bold'}}>{dDayCount.second}</p><p className={styles.body}>초</p>
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

          <div className={styles.body}>오시는 길</div>
          <div id="map" style={{width: '100%', aspectRatio: '1 / 1'}}>
            <Script type="text/javascript" src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}>
              {`
                var map = new naver.maps.Map('map', {
                    center: new naver.maps.LatLng(37.3595704, 127.105399),
                    zoom: 10
                });
              `}
            </Script>
          </div>
        </main>
        <footer className={styles.footer}>
  
        </footer>
      </div>
    </div>
  );
}