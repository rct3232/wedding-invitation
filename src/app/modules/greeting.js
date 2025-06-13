import React, { useEffect, useRef, useState } from "react";
import styles from "./greeting.module.css";

export default function Greeting({ greeting, relation }) {
  // 각 부모 컬럼의 최대 offsetWidth를 저장할 객체 (키는 column 인덱스)
  const parentCells = useRef({});
  const [maxParentWidths, setMaxParentWidths] = useState([]);
  const [totalParentWidth, setTotalParentWidth] = useState("auto");

  // 모든 relation의 부모 요소 측정값을 모아서, 각 컬럼별 최대값을 state에 저장
  useEffect(() => {
    // parentCells.current의 키들을 숫자로 변환 후, 정렬하여 배열로 만듦
    const widths = [];
    let sumParentWidth = 6;
    let parentLength = 0;
    Object.keys(parentCells.current).forEach((key) => {
      const idx = parseInt(key, 10);
      widths[idx] = parentCells.current[idx];
      sumParentWidth += parentCells.current[idx];
      console.log(parentCells.current[idx])
      parentLength++;
    });
    setMaxParentWidths(widths);

    for (let i = 1; i < parentLength+1; i++) sumParentWidth += 14;
    console.log(sumParentWidth);
    setTotalParentWidth(sumParentWidth);
  }, [relation]);

  const generateDetailGridTemplate = (parentCount) => {
    let cols = [];
    for (let i = 0; i < parentCount; i++) {
      const width = maxParentWidths[i] ? `${maxParentWidths[i] + 2}px` : "auto";
      cols.push(width);
      if (i < parentCount - 1) cols.push("4px");
    }

    if (cols.length < 2) return "auto 14px";
    return cols.join(" ")+" 14px";
  };

  const generateContentGridTemplate = () => totalParentWidth + "px 28px auto";

  return (
    <div className="body">
      <div className={styles.greeting}>{greeting}</div>
      <div className={styles.relation}>
        {relation.map((rel, relIndex) => (
          <div
            className={styles.content}
            style={{ gridTemplateColumns: generateContentGridTemplate() }}
            key={relIndex}
          >
            <div
              className={styles.detail}
              style={{ gridTemplateColumns: generateDetailGridTemplate(rel.parent.length) }}
            >
              {rel.parent.map((parentText, i) => (
                <React.Fragment key={i}>
                  <div
                    style={{ textAlign: i === 0 ? "right" : i === rel.parent.length - 1 ? "left" : "center"}}
                    ref={(el) => {
                      if (el) {
                        const currentWidth = el.offsetWidth;
                        if (!parentCells.current[i] || currentWidth > parentCells.current[i]) {
                          parentCells.current[i] = currentWidth;
                        }
                      }
                    }}
                  >
                    {parentText}
                  </div>
                  {i < rel.parent.length - 1 && (
                    <div style={{ textAlign: "center"}}>·</div>
                  )}
                </React.Fragment>
              ))}
              <div>의</div>
            </div>
            <div className={styles.titleWrapper} style={{ textAlign: "center" }}>
              {rel.title}
            </div>
            <div className={styles.nameWrapper} style={{ fontWeight: "bold", textAlign: "center" }}>
              {rel.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
