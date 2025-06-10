"use client"

import { useState } from "react";
import styles from "./bankAccountAccordion.module.css";

const BankAccountAccordion = ({ accountInfo }) => {
  // accountInfo의 길이에 맞춰 초기 상태 배열을 생성 (예, 2개 계좌 섹션)
  const [openStates, setOpenStates] = useState(
    new Array(accountInfo.length).fill(false)
  );

  const toggleAccount = (index) => {
    setOpenStates((prev) =>
      prev.map((isOpen, i) => (i === index ? !isOpen : isOpen))
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("복사되었습니다:", text);
      })
      .catch((err) => {
        console.error("복사에 실패했습니다:", err);
      });
  };

  return (
    <div>
      {accountInfo.map((account, index) => (
        <div
          key={index}
          className={styles.bankAccount}
          style={{ backgroundColor: account.color }}
        >
          <div className={styles.banner}>
            <div className="little">{account.content[0].title}측 계좌번호</div>
            <div
              className={styles.iconAccordion}
              onClick={() => toggleAccount(index)}
            />
          </div>
          {openStates[index] && (
            <div className={styles.body}>
              {account.content.map((item, idx) => (
                <div key={idx} className={styles.row}>
                  <div className={styles.name} style={{ fontWeight: "bold" }}>
                    <div className="little">{item.title}</div>
                    <div className="little">{item.name}</div>
                  </div>
                  <div className={styles.data}>
                    <div className="little">
                      {item.bank} {item.account}
                    </div>
                  </div>
                  <div
                    className={styles.iconCopy}
                    onClick={() =>
                      copyToClipboard(`${item.bank} ${item.account}`)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BankAccountAccordion;
