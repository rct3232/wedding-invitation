"use client"

import { useState } from "react";
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from "./bankAccountAccordion.module.css";

const BankAccountAccordion = ({ accountInfo }) => {
  // 각 계좌 섹션의 열림 상태를 배열로 관리 (예: 신랑측, 신부측 등)
  const [openStates, setOpenStates] = useState(
    new Array(accountInfo.length).fill(true)
  );

  const toggleAccount = (index) => {
    setOpenStates((prev) =>
      prev.map((isOpen, i) => (i === index ? !isOpen : isOpen))
    );
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.info(`복사되었습니다: ${text}`);
      } catch (err) {
        console.error(err);
        fallbackCopyTextToClipboard(text);
      }
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // textarea를 화면에 보이지 않게 설정합니다.
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      toast.info(`복사되었습니다: ${text}`);
    } catch (err) {
      toast.error("복사에 실패했습니다");
      console.error("Fallback: 복사에 실패했습니다:", err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="detail">
      <div className="header">마음 전하실 곳</div>
      {accountInfo.map((account, aidx) => (
        <div
          key={aidx}
          className={styles.bankAccount}
          style={{ backgroundColor: account.color }}
        >
          <div className={styles.banner}>
            <div className="little">
              {account.content[0].title}측 계좌번호
            </div>
            <div
              className={styles.iconAccordion}
              onClick={() => toggleAccount(aidx)}
            />
          </div>
          {openStates[aidx] && (
            <div className={styles.body}>
              {account.content.map((item, idx) => {
                const hasKakao = !!item.kakao;
                return (
                  <div key={idx} className={styles.item}>
                    <div className={styles.rowFlex}>
                      {/* 왼쪽 텍스트 영역(항상 두 줄로 구성) */}
                      <div className={styles.textContainer}>
                        <div className="little" style={{ fontWeight: "bold" }}>
                          {item.title} {item.name}
                        </div>
                        <div className="little">
                          {item.bank} {item.account}
                        </div>
                      </div>
                      {/* 오른쪽 버튼 영역 */}
                      <div className={styles.buttonContainer}>
                        {hasKakao ? (
                          <>
                            {/* 첫 번째 버튼: 특정 URL 열기 */}
                            <div
                              className={styles.kakaobankButton}
                              onClick={() =>
                                window.open(item.kakao, "_blank")
                              }
                            />
                            {/* 두 번째 버튼: 은행+계좌 복사 */}
                            <div
                              className={styles.copyButton}
                              onClick={() =>
                                copyToClipboard(`${item.bank} ${item.account}`)
                              }
                            />
                          </>
                        ) : (
                          // kakao 속성이 없으면 하나의 버튼을 배치하여 두 줄 정보 모두 복사
                          <div
                            className={styles.copyButton}
                            onClick={() =>
                              copyToClipboard(
                                `${item.bank} ${item.account}`
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        limit={1}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </div>
  );
};

export default BankAccountAccordion;