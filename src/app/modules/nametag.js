import styles from "./nametag.module.css";

const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const Nametag = ({ data, isShrink, isGradientActive }) => {
  return (
    <div
      className={`${styles.nametag} ${
        isShrink ? styles.shrink : ""
      } ${isGradientActive ? styles.gradientActive : ""}`}
    >
      <div className={styles.title}>
        {data.person[0].name.eng.first} &amp;{" "}
        {data.person[1].name.eng.first}
      </div>
      <div className={styles.detail} style={{ alignItems: "center" }}>
        <div className={styles.little}>
          {data.content.date.getFullYear()}년{" "}
          {data.content.date.getMonth() + 1}월{" "}
          {data.content.date.getDate()}일{" "}
          {dayOfWeek[data.content.date.getDay()]}요일{" "}
          {data.content.date.getHours()}:
          {String(data.content.date.getMinutes()).padStart(2, "0")}
        </div>
        <div className={styles.little}>{data.place.address.name}</div>
      </div>
    </div>
  );
};

export default Nametag;