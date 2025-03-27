import Image from "next/image";
import styles from "./page.module.css";

const data = {
  manName: "철수",
  womanName: "영희",
  date: {year: 9999, month: 99, day: 99, dayOfWeek: "일", hour: "99", minute: "99"},
  place: {name: "강남구 ABC컨벤션 123홀"}
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Image src="/dummy_header.jpg" alt="Header picture" fill objectFit="cover" objectPosition="center"/>
      <div className={styles.container}>
        <div className={styles.headercover}/>
        <div className={styles.nametag}>
          <div className={styles.title}>{data.manName} 💍 {data.womanName}</div>
          <div className={styles.content}>
            <div className={styles.body}>{data.date.year}년 {data.date.month}월 {data.date.day}일 {data.date.dayOfWeek}요요일 {data.date.hour}:{data.date.minute}</div>
            <div className={styles.body}>{data.place.name}</div>
          </div>
        </div>
        <main className={styles.main}>

        </main>
        <footer className={styles.footer}>
  
        </footer>
      </div>
    </div>
  );
}