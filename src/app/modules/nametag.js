import styles from "./nametag.module.css";

const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const Nametag = ({ data, isShrink, isGradientActive }) => {
  // data.content.colorinvert가 1일 경우에만 inline style 적용
  const titleStyle =
    data.content.colorInvert === 1
      ? { color: isShrink ? "var(--foreground)" : "var(--background)" }
      : {};
  const littleStyle =
    data.content.colorInvert === 1
      ? { color: isShrink ? "var(--foreground)" : "var(--background)" }
      : {};

  return (
    <div
      className={`${styles.nametag} ${
        isShrink ? styles.shrink : ""
      } ${isGradientActive ? styles.gradientActive : ""}`}
    >
      <div className={styles.title} style={titleStyle}>
        {data.person[0].name.eng.first} &amp; {data.person[1].name.eng.first}
      </div>
      <div className={styles.detail} style={{ alignItems: "center" }}>
        <div className={styles.little} style={littleStyle}>
          {data.content.date.getFullYear()}년{" "}
          {data.content.date.getMonth() + 1}월{" "}
          {data.content.date.getDate()}일{" "}
          {dayOfWeek[data.content.date.getDay()]}요일{" "}
          {data.content.date.getHours()}:
          {String(data.content.date.getMinutes()).padStart(2, "0")}
        </div>
        <div className={styles.little} style={littleStyle}>
          {data.place.address.name}
        </div>
      </div>
    </div>
  );
};

export default Nametag;