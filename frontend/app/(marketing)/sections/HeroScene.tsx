"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroScene.module.css";

// The 11s looping hero demo, ported from heron-design/HeroScene.dc.html:
// inbox → open the danger mail → click its login → glitch → terminal → hacker → Heron wipe.
// The stage is a fixed 640×520 coordinate space (matching the px keyframes); a
// ResizeObserver scales it to fit its container, so the cursor always lands on the
// button at any width. prefers-reduced-motion collapses to the final Heron frame.
export function HeroScene() {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () =>
      frame.style.setProperty("--hs-scale", String(frame.clientWidth / 640));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className={styles.hsFrame}>
      <div
        className={styles.hsStage}
        role="img"
        aria-label="Animated demo: a phishing email is opened, its login button clicked, the machine is compromised, then Heron intercepts it."
      >
      <div className={styles.hsMail}>
        <div className={styles.hsTitlebar}>
          <span className={`${styles.hsDot} ${styles.r}`} />
          <span className={`${styles.hsDot} ${styles.y}`} />
          <span className={`${styles.hsDot} ${styles.g}`} />
          <span className={styles.hsTitle}>
            Inbox - hire.vishalpatil@gmail.com
          </span>
        </div>
        <div className={styles.hsBody}>
          <aside className={styles.hsSide}>
            <div className={styles.hsSideH}>Mailboxes</div>
            <div className={`${styles.hsSideI} ${styles.active}`}>
              <span className={styles.c} />
              Inbox
              <span className="ml-auto text-[10px] text-stone">24</span>
            </div>
            <div className={styles.hsSideI}>
              <span className={styles.c} />
              Drafts
            </div>
            <div className={styles.hsSideI}>
              <span className={styles.c} />
              Sent
            </div>
            <div className={styles.hsSideI}>
              <span className={styles.c} />
              Archive
            </div>
            <div className={`${styles.hsSideH} mt-2`}>Smart</div>
            <div className={styles.hsSideI}>
              <span className={styles.c} />
              Flagged
            </div>
            <div className={styles.hsSideI}>
              <span className={styles.c} />
              Unread
            </div>
          </aside>

          <div className={styles.hsList}>
            <div className={styles.hsListH}>
              Inbox <span className={styles.cnt}>24</span>
            </div>
            <div className={`${styles.hsMailItem} ${styles.hsItemDanger}`}>
              <span className={styles.hsUnread} />
              <div className={styles.hsMiTop}>
                <span className={styles.hsMiFrom}>Security Team</span>
                <span>9:41 AM</span>
              </div>
              <div className={styles.hsMiSubj}>
                Your account is suspended - verify immediately
              </div>
              <div className={styles.hsMiPrev}>
                We detected suspicious sign-in activity from an unrecognized
                device…
              </div>
            </div>
            <div className={styles.hsMailItem}>
              <div className={styles.hsMiTop}>
                <span className={styles.hsMiFrom}>Rutuja Bhalerao</span>
                <span>Yesterday</span>
              </div>
              <div className={styles.hsMiSubj}>Lunch Thursday?</div>
              <div className={styles.hsMiPrev}>
                Trying the new place on 4th - 12:30 works for me if it works for
                you.
              </div>
            </div>
            <div className={styles.hsMailItem}>
              <div className={styles.hsMiTop}>
                <span className={styles.hsMiFrom}>Bablu Tailor</span>
                <span>9:18 AM</span>
              </div>
              <div className={styles.hsMiSubj}>Re: Q3 roadmap review</div>
              <div className={styles.hsMiPrev}>
                Comments in the doc - mostly around the launch date and the two
                open…
              </div>
            </div>
            <div className={styles.hsMailItem}>
              <div className={styles.hsMiTop}>
                <span className={styles.hsMiFrom}>GitHub</span>
                <span>8:52 AM</span>
              </div>
              <div className={styles.hsMiSubj}>
                [vai/api] 3 new pull requests need review
              </div>
              <div className={styles.hsMiPrev}>
                #412 refactor(auth): rotate signing keys · #413 fix(billing):
                edge case…
              </div>
            </div>
            <div className={styles.hsMailItem}>
              <div className={styles.hsMiTop}>
                <span className={styles.hsMiFrom}>ProBot</span>
                <span>Yesterday</span>
              </div>
              <div className={styles.hsMiSubj}>
                Weekly digest - 12 issues shipped
              </div>
              <div className={styles.hsMiPrev}>
                Your team completed 12 issues this week across 3 projects…
              </div>
            </div>
          </div>
          <div className={styles.hsPreview}>Select a message to read.</div>
        </div>
      </div>

      <div className={styles.hsReader}>
        <div className={styles.hsRScroll}>
          <h3 className={styles.hsRSubj}>
            Your account is suspended - verify immediately
          </h3>
          <div className={styles.hsRMeta}>
            <span className={styles.hsRAv}>ST</span>
            <span>
              <b>Security Team</b>
              <br />
              <span className={styles.addr}>
                alerts@vai-support.co → hire.vishalpatil@gmail.com · 9:41 AM
              </span>
            </span>
          </div>
          <div className={styles.hsRBody}>
            <p>Hi Vishal,</p>
            <p>
              We detected a suspicious sign-in from an unrecognized device in{" "}
              <b>Bucharest, RO</b> at 03:12 UTC. Your account has been{" "}
              <b>temporarily suspended</b>.
            </p>
            <p>
              Sign in below to confirm your identity within <b>24 hours</b>.
            </p>
            <button className={styles.hsLogin}>Log in to verify account</button>
            <div className={styles.hsRNote}>
              Automated security notice · Message ID 8f31-ac09-b7 · VAi Support
              Services
            </div>
          </div>
        </div>
      </div>

      <svg className={styles.hsCursor} viewBox="0 0 18 24" fill="none">
        <path
          d="M2 2 L2 20 L7 15 L10 22 L13 21 L10 14 L16 14 Z"
          fill="#0a0a0a"
          stroke="#fff"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>

      <div className={styles.hsGlitch}>
        <div className={styles.hsScan} />
        <div className={styles.hsRgb} />
        <div className={styles.hsBars} />
      </div>

      <div className={styles.hsTerm}>
        <div className={`${styles.row} ${styles.r1}`}>
          $ POST vai-support.co/verify ← creds captured
        </div>
        <div className={`${styles.row} ${styles.r2}`}>
          → session cookie cloned… <span className="text-[#c8ffd6]">ok</span>
        </div>
        <div className={`${styles.row} ${styles.r3}`}>
          → dropping payload /tmp/.k3rn3l.bin
        </div>
        <div className={`${styles.row} ${styles.r4}`}>
          → escalating privileges…{" "}
          <span className={styles.granted}>ACCESS GRANTED</span>
        </div>
        <div className={`${styles.row} ${styles.r5}`}>
          → exfiltrating ~/keychain, ~/.ssh, session tokens…
        </div>
        <div className={`${styles.row} ${styles.r6}`}>
          → downloading ██████████ 100%
          <span className={styles.hsCaret} />
        </div>
      </div>

      <div className={styles.hsHack}>
        <div className={styles.hsCode} aria-hidden="true">
          01001000 00110001 4f 55 89 e5 push %rbp mov %rsp,%rbp
          <br />
          02fa dd91 c3ff 00e2 shell.exec(&quot;/bin/bash&quot;)
          <br />
          exfil.tar.gz → 185.209.14.22:4444
          <br />
          uid=0(root) gid=0(root) groups=0(root)
          <br />
          found: aws_secret_key, stripe_live_sk, gh_pat
          <br />
          beacon [alive] every 30s
          <br />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.hsHackerImg} src="/hero-hacker.jpg" alt="" />
      </div>

      <div className={styles.hsHeron}>
        <div className={styles.wipe} />
        <div className={styles.msg}>
          <div className={styles.logo}>
            <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
              <path
                d="M22 45 C13 43 11 33 19 29 C28 25 35 31 35 39 C35 43.5 29 46 22 45 Z"
                fill="#fff"
              />
              <path
                d="M33 35 C33 27 29 24 32 19 C35 14 42 15 43 20"
                stroke="#fff"
                strokeWidth="4.6"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M41 17 L44 22.5 L60 26 Z" fill="#fff" />
              <circle cx="39.5" cy="19.5" r="1.9" fill="#ff5530" />
              <path
                d="M24 45 L24 54.5"
                stroke="#fff"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M30 45 L30 54.5"
                stroke="#fff"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M3 56 H18"
                stroke="#ff5530"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              <path
                d="M36 56 H61"
                stroke="#ff5530"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.word}>Heron</span>
          </div>
          <h2>
            Heron would&apos;ve <em>caught</em> this.
          </h2>
          <p className={styles.sub}>
            Spoofed sender, lookalike domain, credential-harvest form. Flagged
            and quarantined before it reached the inbox.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
