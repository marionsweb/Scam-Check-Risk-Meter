import { useCallback, useRef, useState } from "react";

export type RiskLevel = "low" | "medium" | "high";
export type CheckerStatus = "empty" | "idle" | "checking" | "result" | "error";

export type ScamFlag = {
  id: string;
  label: string;
  detail: string;
  evidence: string;
  severity: "watch" | "warning" | "danger";
};

export type ScamResult = {
  score: number;
  level: RiskLevel;
  flags: ScamFlag[];
  checkedAt: string;
};

type Rule = ScamFlag & {
  patterns: RegExp[];
  points: number;
};

const EXAMPLE_MESSAGE =
  "Congratulations! You have been selected for a remote data entry job paying ₦450,000 weekly. No experience needed. Kindly pay ₦18,500 for your registration and training slot today so we can process your offer. Send payment to our agent on WhatsApp.";

const RULES: Rule[] = [
  {
    id: "upfront-payment",
    label: "They want money before you start",
    detail: "Real employers do not charge you a registration, training, equipment, or processing fee to receive a job.",
    evidence: "registration and training",
    severity: "danger",
    points: 32,
    patterns: [/\b(pay|payment|fee|deposit|charge|send money|transfer)\b/i, /\bregistration\b/i, /\btraining\b/i, /\bprocessing\b/i],
  },
  {
    id: "urgency",
    label: "Pressure to act immediately",
    detail: "Scammers manufacture a deadline so you do not have time to verify the person or offer.",
    evidence: "today",
    severity: "warning",
    points: 16,
    patterns: [/\b(today|now|immediately|urgent|asap|within \d+ hours?|last chance)\b/i],
  },
  {
    id: "too-good",
    label: "The pay sounds unusually high",
    detail: "Big money for simple work, especially with no experience, is a classic bait tactic.",
    evidence: "₦450,000 weekly",
    severity: "danger",
    points: 24,
    patterns: [/(₦|ngn|naira|\$)\s?[\d,.]+\s?(weekly|daily|per day|per week|every week)/i, /\b(double your money|guaranteed income|easy money|passive income)\b/i],
  },
  {
    id: "no-experience",
    label: "No experience required, big reward",
    detail: "That combination is designed to pull you in before any real role, company, or work is explained.",
    evidence: "No experience needed",
    severity: "warning",
    points: 12,
    patterns: [/\bno (experience|skills?) (needed|required)\b/i, /\banyone can\b/i],
  },
  {
    id: "private-channel",
    label: "The conversation is pushed to a private channel",
    detail: "WhatsApp and Telegram are useful tools, but scammers use private chats to avoid public verification.",
    evidence: "WhatsApp",
    severity: "watch",
    points: 9,
    patterns: [/\bwhats?app\b/i, /\btelegram\b/i, /\bdm me\b/i, /\bmessage our agent\b/i],
  },
  {
    id: "identity",
    label: "They ask for sensitive personal details",
    detail: "Do not send your BVN, OTP, PIN, card details, or ID photos to an unverified contact.",
    evidence: "personal or banking details",
    severity: "danger",
    points: 28,
    patterns: [/\bbvn\b/i, /\botp\b/i, /\b(pin|card number|account number|bank details)\b/i, /\bidentity card\b/i, /\b(send|share) (your )?(id|passport)\b/i],
  },
  {
    id: "vague-company",
    label: "The employer is hard to verify",
    detail: "A credible offer should name a real company, role, contact, and a way to verify the vacancy independently.",
    evidence: "our agent",
    severity: "warning",
    points: 11,
    patterns: [/\bour agent\b/i, /\bdear beneficiary\b/i, /\bselected as a beneficiary\b/i, /\bkindly contact\b/i],
  },
  {
    id: "guarantee",
    label: "Guarantees are doing the selling",
    detail: "Honest work and investments carry conditions. Words like guaranteed and risk-free are a warning sign.",
    evidence: "guaranteed",
    severity: "warning",
    points: 18,
    patterns: [/\bguaranteed\b/i, /\brisk[- ]?free\b/i, /\b100%\b/i, /\bno risk\b/i],
  },
];

function ruleMatches(text: string, rule: Rule) {
  const matches = rule.patterns.filter((pattern) => pattern.test(text));
  return matches.length > 0;
}

function detectScam(text: string): ScamResult {
  const normalized = text.trim();
  const flags = RULES.filter((rule) => ruleMatches(normalized, rule)).map(
    ({ patterns: _patterns, points: _points, ...flag }) => flag,
  );
  const points = RULES.filter((rule) => ruleMatches(normalized, rule)).reduce(
    (total, rule) => total + rule.points,
    0,
  );
  const score = Math.min(98, Math.max(4, points));
  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return {
    score,
    level,
    flags,
    checkedAt: new Date().toISOString(),
  };
}

export function useScamChecker() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<CheckerStatus>("empty");
  const [result, setResult] = useState<ScamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const check = useCallback(() => {
    if (!text.trim()) {
      setStatus("empty");
      setError("Paste a message first so I can inspect it.");
      return;
    }
    setError(null);
    setStatus("checking");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        setResult(detectScam(text));
        setStatus("result");
      } catch {
        setStatus("error");
        setError("I could not read that message. Try pasting it again.");
      }
    }, 720);
  }, [text]);

  const reset = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setText("");
    setResult(null);
    setError(null);
    setStatus("empty");
  }, []);

  const loadExample = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setText(EXAMPLE_MESSAGE);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    text,
    setText,
    status,
    result,
    error,
    check,
    reset,
    loadExample,
    exampleMessage: EXAMPLE_MESSAGE,
  };
}