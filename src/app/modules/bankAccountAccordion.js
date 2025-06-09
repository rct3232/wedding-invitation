"use client"

import { useState } from "react";
import styles from "./bankAccountAccordion.module.css";

const BankAccountAccordion = ({ data }) => {
  const [isOpenMan, setIsOpenMan] = useState(false);
  const [isOpenWoman, setIsOpenWoman] = useState(false);

  const toggleMan = () => setIsOpenMan((prev) => !prev);
  const toggleWoman = () => setIsOpenWoman((prev) => !prev);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // 성공 시 알림 메시지 또는 콘솔 출력
        console.log("복사되었습니다:", text);
      })
      .catch((err) => {
        console.error("복사에 실패했습니다:", err);
      });
  };

  return (
    <div>
      {/* 신랑측 계좌번호 섹션 */}
      <div className={styles.bankAccount} style={{ backgroundColor: "#889EB0" }}>
        <div className={styles.banner}>
          <div className="little">신랑측 계좌번호</div>
          {/* 아이콘 클릭 시 해당 섹션 토글 */}
          <div className={styles.iconAccordion} onClick={toggleMan} />
        </div>
        {isOpenMan && (
          <div className={styles.body}>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                신랑 {data.manName.last} {data.manName.first}
              </div>
              <div className="little">
                {data.account.man.self.bank} {data.account.man.self.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.man.self.bank} ${data.account.man.self.account}`
                  )
                }
              />
            </div>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                아버지 {data.parent.man.father}
              </div>
              <div className="little">
                {data.account.man.father.bank} {data.account.man.father.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.man.father.bank} ${data.account.man.father.account}`
                  )
                }
              />
            </div>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                어머니 {data.parent.man.mother}
              </div>
              <div className="little">
                {data.account.man.mother.bank} {data.account.man.mother.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.man.mother.bank} ${data.account.man.mother.account}`
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* 신부측 계좌번호 섹션 */}
      <div className={styles.bankAccount} style={{ backgroundColor: "#C39898" }}>
        <div className={styles.banner}>
          <div className="little">신부측 계좌번호</div>
          {/* 아이콘 클릭 시 해당 섹션 토글 */}
          <div className={styles.iconAccordion} onClick={toggleWoman} />
        </div>
        {isOpenWoman && (
          <div className={styles.body}>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                신부 {data.womanName.last} {data.womanName.first}
              </div>
              <div className="little">
                {data.account.woman.self.bank} {data.account.woman.self.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.woman.self.bank} ${data.account.woman.self.account}`
                  )
                }
              />
            </div>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                아버지 {data.parent.woman.father}
              </div>
              <div className="little">
                {data.account.woman.father.bank} {data.account.woman.father.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.woman.father.bank} ${data.account.woman.father.account}`
                  )
                }
              />
            </div>
            <div className={styles.row}>
              <div className="little" style={{ fontWeight: "bold" }}>
                어머니 {data.parent.woman.mother}
              </div>
              <div className="little">
                {data.account.woman.mother.bank} {data.account.woman.mother.account}
              </div>
              <div
                className={styles.iconCopy}
                onClick={() =>
                  copyToClipboard(
                    `${data.account.woman.mother.bank} ${data.account.woman.mother.account}`
                  )
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccountAccordion;
