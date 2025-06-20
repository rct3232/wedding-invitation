import React, { useLayoutEffect, useRef, useState } from "react";
import styles from "./greeting.module.css";

const Greeting = ({ greeting, relation }) => {
  const parentCells = useRef({});
  const [layout, setLayout] = useState({ widths: [], total: "auto" });

  useLayoutEffect(() => {
    const widths = [];
    let sum = 6;
    let count = 0;

    Object.entries(parentCells.current).forEach(([key, w]) => {
      const idx = +key;
      widths[idx] = w;
      sum += w;
      count++;
    });

    // 컬럼 사이 간격(14px) 더하기
    sum += count * 14;
    sum += "px";

    setLayout({ widths, total: sum });
  }, [relation]);

  const generateDetailGridTemplate = (parentCount) => {
    let cols = [];
    for (let i = 0; i < parentCount; i++) {
      const width = layout.widths[i] ? `${layout.widths[i] + 2}px` : "auto";
      cols.push(width);
      if (i < parentCount - 1) cols.push("4px");
    }

    if (cols.length < 2) return "auto 14px";
    return cols.join(" ")+" 14px";
  };

  const generateContentGridTemplate = () => layout.total + " 28px auto";

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

export default Greeting;