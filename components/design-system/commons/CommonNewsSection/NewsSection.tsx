"use client";

import React, { useRef, useEffect } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import clsx from "clsx";
import s from "./style.module.css";

// [TENOR 2026 MIGRATION] GSAP → Framer Motion v12.
// API: useMotionValue + animate(motionValue, target, options) — typed correctly.
// useAnimation() and its LegacyAnimationControls are NOT used (incompatible with AnimationPlaybackControls).

// --- DATA ---
export interface NewsItem {
  id: string;
  country: string;
  color: string;
  title: string;
  excerpt: string;
  time: string;
  date: string;
  source: string;
}

export const REALISTIC_NEWS_LEFT: NewsItem[] = [
  {
    id: "nl1",
    country: "TOGO",
    color: "white",
    time: "10:55",
    date: "04/10/24",
    source: "Financial Afrik",
    title: "Ecobank Transnational Inc. announces record Q3 earnings",
    excerpt:
      "The pan-African banking group ETI reported a 15% increase in net revenue, driven by strong performance in UEMOA region.",
  },
  {
    id: "nl2",
    country: "BENIN",
    color: "white",
    time: "10:42",
    date: "04/10/24",
    source: "BRVM Info",
    title: "BOA Benin expands digital banking services",
    excerpt:
      "Bank of Africa Benin launches a new mobile app feature allowing instant micro-loans for SMEs.",
  },
  {
    id: "nl3",
    country: "CONGO",
    color: "white",
    time: "09:30",
    date: "04/10/24",
    source: "Reuters Africa",
    title: "Oil sector volatility impacts regional indices",
    excerpt:
      "Fluctuations in crude oil prices are causing mixed reactions across energy stocks in the CEMAC zone.",
  },
  {
    id: "nl4",
    country: "IVORY COAST",
    color: "white",
    time: "09:15",
    date: "04/10/24",
    source: "Abidjan.net",
    title: "Sonatel declares special dividend payout",
    excerpt:
      "Shareholders of Sonatel will receive an exceptional dividend following the sale of tower assets.",
  },
  {
    id: "nl5",
    country: "SENEGAL",
    color: "white",
    time: "08:45",
    date: "04/10/24",
    source: "Dakar Actu",
    title: "Total Senegal invests in solar energy projects",
    excerpt:
      "The energy giant commits 5 billion FCFA to renewable energy infrastructure in rural Senegal.",
  },
];

export const REALISTIC_NEWS_RIGHT: NewsItem[] = [
  {
    id: "nr1",
    country: "REGIONAL",
    color: "gold",
    time: "11:00",
    date: "04/10/24",
    source: "UEMOA Markets",
    title: "BRVM Composite Index hits 5-year high",
    excerpt:
      "Bullish sentiment dominates as banking and telecom sectors rally on strong economic data.",
  },
  {
    id: "nr2",
    country: "BENIN",
    color: "gold",
    time: "10:50",
    date: "04/10/24",
    source: "EcoMatin",
    title: "Benin government bonds oversubscribed by 200%",
    excerpt:
      "Investor confidence in Benin's sovereign debt remains high despite global inflationary pressures.",
  },
  {
    id: "nr3",
    country: "NIGERIA",
    color: "gold",
    time: "10:15",
    date: "04/10/24",
    source: "Business Day",
    title: "Dangote Cement expands export capacity",
    excerpt:
      "New terminal in Lagos will facilitate cement exports to neighboring West African countries.",
  },
  {
    id: "nr4",
    country: "GHANA",
    color: "gold",
    time: "09:45",
    date: "04/10/24",
    source: "Accra News",
    title: "Ghana Stock Exchange introduces new ESG guidelines",
    excerpt:
      "Listed companies must now disclose environmental impact reports starting next fiscal year.",
  },
  {
    id: "nr5",
    country: "KENYA",
    color: "gold",
    time: "09:00",
    date: "04/10/24",
    source: "The EastAfrican",
    title: "Safaricom launches M-Pesa Global Pay",
    excerpt:
      "New partnership with Visa enables M-Pesa users to make payments on global e-commerce platforms.",
  },
];

// ============================================================================
// [TENOR 2026] InfiniteNewsScroller — Framer Motion v12 correct API
// Uses: useMotionValue(y) + animate(motionValue, target, { duration, ease })
// Behavior: linear yoyo scroll, pause on hover, infinite repeat.
// ============================================================================
interface InfiniteNewsScrollerProps {
  items: NewsItem[];
  /** If true, starts from bottom and scrolls up first (mirrors GSAP reverse option). */
  reverse?: boolean;
  id?: string;
}

const SCROLL_SPEED_PX_PER_SECOND = 9;
const ENDPOINT_PAUSE_MS = 1000;

const InfiniteNewsScroller: React.FC<InfiniteNewsScrollerProps> = ({
  items,
  reverse = false,
  id,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // [FRAMER v12] useMotionValue provides the y MotionValue passed to motion.div style.
  const y = useMotionValue(0);

  // [FRAMER v12] We store the running AnimationPlaybackControls in a ref so we
  // can call .stop() / .cancel() at any time without re-render.
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const isPausedRef = useRef(false);
  const currentYRef = useRef(0);
  const directionRef = useRef<1 | -1>(reverse ? 1 : -1);
  const abortedRef = useRef(false);

  useEffect(() => {
    abortedRef.current = false;

    const runLoop = async () => {
      // Wait one rAF for DOM layout to stabilize
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const containerH = wrapper.parentElement?.clientHeight ?? 0;
      const contentH = wrapper.scrollHeight;

      // Nothing to scroll if content fits
      if (contentH <= containerH || containerH === 0) return;

      const maxY = contentH - containerH;

      // Set initial position (reverse: start from bottom)
      if (reverse) {
        currentYRef.current = -maxY;
        y.set(-maxY);
        directionRef.current = 1; // first move: scroll up toward 0
      } else {
        currentYRef.current = 0;
        directionRef.current = -1; // first move: scroll down toward -maxY
      }

      // Yoyo loop
      while (!abortedRef.current) {
        // If paused by hover, spin until resumed
        if (isPausedRef.current) {
          await new Promise<void>((r) => setTimeout(r, 80));
          continue;
        }

        const from = currentYRef.current;
        const to = directionRef.current === -1 ? -maxY : 0;
        const distance = Math.abs(to - from);
        const duration = distance / SCROLL_SPEED_PX_PER_SECOND;

        if (duration < 0.01) {
          // Already at target: pause and flip
          directionRef.current = directionRef.current === -1 ? 1 : -1;
          await new Promise<void>((r) => setTimeout(r, ENDPOINT_PAUSE_MS));
          continue;
        }

        // [FRAMER v12] animate(motionValue, target, options) — correct API
        animationRef.current = animate(y, to, {
          duration,
          ease: "linear",
        });

        // Wait for the animation to complete
        await animationRef.current;
        if (abortedRef.current) break;

        currentYRef.current = to;

        // Natural pause at extremity
        await new Promise<void>((r) => setTimeout(r, ENDPOINT_PAUSE_MS));
        if (abortedRef.current) break;

        // Flip direction (yoyo)
        directionRef.current = directionRef.current === -1 ? 1 : -1;
      }
    };

    runLoop();

    return () => {
      abortedRef.current = true;
      animationRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    isPausedRef.current = true;
    animationRef.current?.stop();
  };

  const handleMouseLeave = () => {
    isPausedRef.current = false;
    // The while-loop will detect isPaused=false next iteration and resume from currentYRef
  };

  const renderList = (data: NewsItem[]) => (
    <ul className={s["equity-article-research-news-list"]}>
      {data.map((item) => (
        <li key={item.id} className={s["equity-article-research-news-item"]}>
          <div className={s["equity-article-research-news-content"]}>
            <div className={s["equity-article-research-news-header"]}>
              <span
                className={clsx(
                  s["equity-article-research-news-country"],
                  item.color === "gold" && s["is-gold"],
                )}
              >
                {item.country}
              </span>
              <span
                className={clsx(s["equity-article-research-news-bullet"], "mx-1")}
              />
              <span className={s["equity-article-research-news-timestamp"]}>
                {item.time} - {item.date}
              </span>
            </div>
            <div className={s["equity-article-research-news-body"]}>
              <strong>{item.title}</strong> — {item.excerpt}{" "}
              <a
                href="#"
                className={clsx(
                  s["equity-article-research-news-read-more"],
                  item.color === "gold" && s["is-gold"],
                )}
              >
                Read More
              </a>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      id={id}
      className={s["equity-article-research-news-list-container"]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={s["equity-article-research-news-scroll-wrapper"]}
        style={{ overflow: "hidden" }}
      >
        {/* [FRAMER v12] style={{ y }} binds the MotionValue directly — no animate prop needed */}
        <motion.div ref={wrapperRef} style={{ y }}>
          {renderList(items)}
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// [TENOR 2026] CommonNewsSection — Two-column infinite scroll
// ============================================================================
export const CommonNewsSection = React.memo(() => {
  return (
    <div className={s["equity-article-research-news-container"]}>
      <InfiniteNewsScroller items={REALISTIC_NEWS_LEFT} reverse={false} />
      <InfiniteNewsScroller
        items={REALISTIC_NEWS_RIGHT}
        reverse={true}
        id="news-container-right"
      />
    </div>
  );
});
CommonNewsSection.displayName = "CommonNewsSection";

// Alias pour rétrocompatibilité
export const NewsSection = CommonNewsSection;

// --- EOF ---
