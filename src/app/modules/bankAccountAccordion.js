"use client"

import { useState, useRef } from "react";
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from "./bankAccountAccordion.module.css";

const BankAccountAccordion = ({ accountInfo }) => {
  const [openStates, setOpenStates] = useState(
    new Array(accountInfo.length).fill(true)
  );

  const contentRefs = useRef([]);

  const toggleAccount = (index) => {
    const panel = contentRefs.current[index];
    const isOpen = openStates[index];

    if (!panel) return;

    if (!isOpen) {
      panel.style.display = 'block';
      panel.style.height = '0px';
      panel.style.opacity = '0';
      panel.style.transition = 'none';
      panel.offsetHeight;

      panel.style.transition = 'height 0.3s ease, opacity 0.3s ease';
      panel.style.height = panel.scrollHeight + 'px';
      panel.style.opacity = '1';

      setTimeout(() => {
        panel.style.height = '';
        panel.style.transition = '';
        panel.style.opacity = '';
      }, 300);
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      panel.style.opacity = '1';
      panel.style.transition = 'none';
      panel.offsetHeight;

      panel.style.transition = 'height 0.3s ease, opacity 0.3s ease';
      panel.style.height = '0px';
      panel.style.opacity = '0';

      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    }

    setOpenStates(prev =>
      prev.map((v, i) => (i === index ? !v : v))
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
      document.execCommand("copy");
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
              className={`${styles.iconAccordion} ${openStates[aidx] ? styles.iconAccordionOpen : ''}`}
              onClick={() => toggleAccount(aidx)}
            />
          </div>
          <div
            ref={el => (contentRefs.current[aidx] = el)}
            className={styles.accordion}
          >
            {account.content.map((item, idx) => {
              const hasKakao = !!item.kakao;
              return (
                <div key={idx} className={styles.item}>
                  <div className={styles.rowFlex}>
                    <div className={styles.textContainer}>
                      <div className="little" style={{ fontWeight: "bold" }}>
                        {item.title} {item.name}
                      </div>
                      <div className="little">
                        {item.bank} {item.account}
                      </div>
                    </div>
                    <div className={styles.buttonContainer}>
                      {hasKakao ? (
                        <>
                          <div
                            className={styles.kakaobankButton}
                            onClick={() => window.open(item.kakao, "_blank")}
                          />
                          <div
                            className={styles.copyButton}
                            onClick={() =>
                              copyToClipboard(`${item.bank} ${item.account}`)
                            }
                          />
                        </>
                      ) : (
                        <div
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(`${item.bank} ${item.account}`)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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