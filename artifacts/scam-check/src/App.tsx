import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Info,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  type RiskLevel,
  type ScamFlag,
  useScamChecker,
} from "@/hooks/use-scam-checker";
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const {
    text,
    setText,
    status,
    result,
    error,
    check,
    reset,
    loadExample,
  } = useScamChecker();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyReport = async () => {
    if (!result) return;
    const report = `Scam Check: ${result.level} risk (${result.score}/100)\n${result.flags.map((flag) => `- ${flag.label}: ${flag.evidence}`).join("\n") || "No obvious red flags found."}`;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const isChecking = status === "checking";

  return (
    <main className="scam-page min-h-[100dvh] text-[hsl(var(--foreground))]">
      <div className="mx-auto min-h-[100dvh] max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[hsl(var(--border)/.75)] py-5">
          <div className="flex items-center gap-3" data-testid="brand-scam-check">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[hsl(var(--primary))] text-[hsl(var(--accent))] shadow-[4px_4px_0_hsl(var(--accent))]">
              <ShieldCheck size={21} strokeWidth={2.2} />
            </div>
            <div>
              <div className="brand-mark text-[20px] leading-none">SCAM CHECK</div>
              <div className="mono-type mt-1 text-[9px] uppercase text-[hsl(var(--muted-foreground))]">For the messages that feel off</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] sm:flex" data-testid="status-local-only">
            <LockKeyhole size={13} />
            Stays on this device
          </div>
          <a href="#how-it-works" className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] underline decoration-[hsl(var(--accent))] decoration-2 underline-offset-4 sm:hidden" data-testid="link-how-mobile">
            How it works <ArrowUpRight size={14} />
          </a>
        </header>

        <section className="grid gap-10 pb-14 pt-14 lg:grid-cols-[minmax(0,.92fr)_minmax(520px,1.08fr)] lg:items-end lg:gap-16 lg:pb-20 lg:pt-20">
          <div className="scan-in max-w-[570px]">
            <div className="mono-type mb-5 flex items-center gap-3 text-[10px] font-bold uppercase text-[hsl(var(--destructive))]" data-testid="text-kicker">
              <span className="h-px w-8 bg-[hsl(var(--destructive))]" />
              Your inbox’s second opinion
            </div>
            <h1 className="display-type max-w-[650px] text-[clamp(3.2rem,8vw,6.7rem)] leading-[.87] text-[hsl(var(--primary))]" data-testid="heading-main">
              Before you <span className="relative inline-block text-[hsl(var(--destructive))]">send it<span className="absolute -bottom-1 left-0 h-2 w-full -rotate-2 bg-[hsl(var(--accent))] opacity-80" /></span>,<br />
              let’s check it.
            </h1>
            <p className="mt-7 max-w-[470px] text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg sm:leading-8" data-testid="text-intro">
              Paste the job offer, investment pitch, or “urgent” message. I’ll point out what feels wrong — plainly, without the lecture.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[hsl(var(--primary))]">
              <span className="flex items-center gap-2" data-testid="text-local-badge"><span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" /> Private by design</span>
              <span className="flex items-center gap-2" data-testid="text-free-badge"><span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" /> Free to use</span>
            </div>
          </div>

          <div className="scan-in-delay">
            <ScanCard
              text={text}
              setText={setText}
              onCheck={check}
              onReset={reset}
              onExample={loadExample}
              isChecking={isChecking}
              error={error}
            />
          </div>
        </section>

        <section className="grid gap-7 border-t border-[hsl(var(--border)/.75)] py-10 md:grid-cols-[1.05fr_.95fr] md:py-14" aria-live="polite">
          <div>
            <div className="mono-type mb-4 text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">The readout</div>
            {status === "empty" || status === "idle" ? <EmptyReadout onExample={loadExample} /> : null}
            {isChecking ? <CheckingReadout /> : null}
            {status === "error" ? <ErrorReadout message={error} onRetry={check} /> : null}
            {status === "result" && result ? (
              <ResultReadout result={result} onCopy={copyReport} copied={copied} onReset={reset} />
            ) : null}
          </div>
          <AsideCard status={status} result={result} />
        </section>

        <section id="how-it-works" className="grid gap-8 border-t border-[hsl(var(--border)/.75)] py-12 md:grid-cols-[.7fr_1.3fr] md:py-16">
          <div>
            <div className="mono-type mb-3 text-[10px] font-bold uppercase text-[hsl(var(--destructive))]">How it thinks</div>
            <h2 className="display-type max-w-[330px] text-4xl leading-[.95] text-[hsl(var(--primary))] sm:text-5xl" data-testid="heading-how-it-works">Sharp eyes.<br />No wild guesses.</h2>
          </div>
          <div className="grid gap-0 divide-y divide-[hsl(var(--border))] border-y border-[hsl(var(--border))]">
            <HowRow number="01" title="Looks for pressure" copy="Deadlines, secrecy, and “act now” language are built to rush your judgement." />
            <HowRow number="02" title="Checks the ask" copy="Upfront fees, banking details, and requests for an OTP are never normal for a job offer." />
            <HowRow number="03" title="Shows its work" copy="Every score comes with the exact clues it found, so you can make the final call." />
          </div>
        </section>

        <footer id="privacy" className="flex flex-col gap-4 border-t border-[hsl(var(--border)/.75)] py-7 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row sm:items-center sm:justify-between">
          <p data-testid="text-footer-note">Built for a slower second look. Especially when the offer is in naira.</p>
          <div className="flex items-center gap-2 font-semibold text-[hsl(var(--primary))]"><LockKeyhole size={13} /> Nothing leaves your browser.</div>
        </footer>
      </div>
    </main>
  );
}

type ScanCardProps = {
  text: string;
  setText: (value: string) => void;
  onCheck: () => void;
  onReset: () => void;
  onExample: () => void;
  isChecking: boolean;
  error: string | null;
};

function ScanCard({ text, setText, onCheck, onReset, onExample, isChecking, error }: ScanCardProps) {
  const canCheck = Boolean(text.trim()) && !isChecking;
  return (
    <div className="paper-card relative overflow-hidden rounded-[26px] p-5 sm:p-7">
      <div className="absolute right-0 top-0 h-28 w-28 translate-x-7 -translate-y-7 rounded-full bg-[hsl(var(--accent)/.28)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="mono-type text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Drop the message here</div>
          <p className="mt-2 text-sm font-semibold text-[hsl(var(--primary))]">A suspicious offer? Let’s look at it together.</p>
        </div>
        <div className="rounded-xl bg-[hsl(var(--secondary))] p-2.5 text-[hsl(var(--primary))]" title="Local-only scan">
          <Search size={18} />
        </div>
      </div>
      <div className="relative mt-5">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a message, email, or offer..."
          className="scan-textarea min-h-[218px] w-full resize-y rounded-2xl border border-[hsl(var(--input))] px-4 py-3 text-[15px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/.8)] sm:min-h-[236px]"
          data-testid="input-message"
          aria-label="Message to check"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
          <span data-testid="text-character-count">{text.length.toLocaleString()} characters</span>
          {text ? <button type="button" onClick={onReset} className="flex items-center gap-1 font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--destructive))]" data-testid="button-clear-message"><X size={13} /> Clear</button> : <span>Nothing is uploaded</span>}
        </div>
      </div>
      {error ? <div className="relative mt-3 flex items-start gap-2 rounded-xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] px-3 py-2.5 text-xs font-semibold text-[hsl(var(--destructive))]" role="alert" data-testid="status-error"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}</div> : null}
      <div className="relative mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onExample} className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] underline decoration-[hsl(var(--accent))] decoration-2 underline-offset-4 transition-colors hover:text-[hsl(var(--primary))]" data-testid="button-try-example">
          <ClipboardPaste size={15} /> Try a sample message
        </button>
        <button type="button" onClick={onCheck} disabled={!canCheck} className="group flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-black text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--accent))] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none" data-testid="button-check-message">
          {isChecking ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--primary-foreground)/.35)] border-t-[hsl(var(--accent))]" /> Checking...</> : <>Check this message <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
        </button>
      </div>
    </div>
  );
}

function EmptyReadout({ onExample }: { onExample: () => void }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.44)] p-6 sm:p-8" data-testid="state-empty">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><ShieldAlert size={22} /></div>
      <h2 className="mt-6 text-2xl font-black tracking-[-.04em] text-[hsl(var(--primary))]">No message, no verdict.</h2>
      <p className="mt-2 max-w-[420px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">Paste the message above and I’ll separate normal sales talk from the clues that deserve your attention.</p>
      <button type="button" onClick={onExample} className="mt-6 flex items-center gap-2 text-sm font-black text-[hsl(var(--primary))] underline decoration-[hsl(var(--accent))] decoration-4 underline-offset-4" data-testid="button-empty-example">See what a scan looks like <ArrowUpRight size={16} /></button>
    </div>
  );
}

function CheckingReadout() {
  return (
    <div className="paper-card overflow-hidden rounded-[22px] p-6 sm:p-8" data-testid="state-checking">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
      </div>
      <div className="mt-8 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        <div className="w-full space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
        </div>
      </div>
      <div className="checking-line mt-8 h-1 w-full" />
      <p className="mono-type mt-4 text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Reading the fine print...</p>
    </div>
  );
}

function ErrorReadout({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="rounded-[22px] border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] p-6 sm:p-8" data-testid="state-error">
      <AlertTriangle size={27} className="text-[hsl(var(--destructive))]" />
      <h2 className="mt-5 text-2xl font-black tracking-[-.04em] text-[hsl(var(--primary))]">That scan tripped.</h2>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{message ?? "Something went wrong."}</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-black text-[hsl(var(--primary-foreground))]" data-testid="button-retry-check">Try again</button>
    </div>
  );
}

function ResultReadout({ result, onCopy, copied, onReset }: { result: { score: number; level: RiskLevel; flags: ScamFlag[] }; onCopy: () => void; copied: boolean; onReset: () => void }) {
  const risk = riskDetails(result.level);
  const ringStyle = {
    "--score": `${result.score}%`,
    "--risk-color": risk.color,
  } as CSSProperties;
  return (
    <div className="paper-card rounded-[22px] p-6 sm:p-8" data-testid="state-result">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mono-type text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">My honest read</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.045em] text-[hsl(var(--primary))]" data-testid="text-risk-heading">{risk.title}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCopy} className="flex h-9 items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 text-xs font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--secondary))]" data-testid="button-copy-report">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}</button>
          <button type="button" onClick={onReset} className="flex h-9 items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 text-xs font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--secondary))]" data-testid="button-reset-result"><RotateCcw size={14} /> Reset</button>
        </div>
      </div>
      <div className="mt-7 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="risk-ring relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={ringStyle} data-testid="value-risk-score">
          <div className="relative z-10 text-center">
            <div className="display-type text-4xl leading-none text-[hsl(var(--primary))]">{result.score}</div>
            <div className="mono-type mt-1 text-[9px] font-bold uppercase text-[hsl(var(--muted-foreground))]">out of 100</div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-black" style={{ color: risk.color }} data-testid="text-risk-level"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: risk.color }} /> {risk.label}</div>
          <p className="mt-2 max-w-[400px] text-sm leading-6 text-[hsl(var(--muted-foreground))]" data-testid="text-risk-summary">{risk.summary}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-[hsl(var(--border))] pt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-[hsl(var(--primary))]">{result.flags.length ? `${result.flags.length} thing${result.flags.length === 1 ? "" : "s"} caught my eye` : "No obvious red flags found"}</h3>
          <span className="mono-type text-[9px] font-bold uppercase text-[hsl(var(--muted-foreground))]">Explainable scan</span>
        </div>
        {result.flags.length ? <div className="mt-4 space-y-2.5">{result.flags.map((flag, index) => <FlagRow flag={flag} index={index} key={flag.id} />)}</div> : <NoFlags />}
      </div>
    </div>
  );
}

function FlagRow({ flag, index }: { flag: ScamFlag; index: number }) {
  const details = flagTone(flag.severity);
  return (
    <div className="flag-row rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.56)] p-3.5" style={{ animationDelay: `${index * 70}ms` }} data-testid={`row-red-flag-${flag.id}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: details.color, backgroundColor: details.background }}>{details.icon}</div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className="text-sm font-black text-[hsl(var(--primary))]" data-testid={`text-flag-label-${flag.id}`}>{flag.label}</h4>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em]" style={{ color: details.color, backgroundColor: details.background }}>{details.label}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{flag.detail}</p>
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-[hsl(var(--secondary))] px-2 py-1 font-mono text-[10px] font-bold text-[hsl(var(--primary))]" data-testid={`text-flag-evidence-${flag.id}`}><span className="text-[hsl(var(--muted-foreground))]">Found:</span> “{flag.evidence}”</div>
        </div>
      </div>
    </div>
  );
}

function NoFlags() {
  return (
    <div className="mt-4 flex gap-3 rounded-xl border border-[hsl(var(--chart-2)/.25)] bg-[hsl(var(--chart-2)/.07)] p-4" data-testid="state-no-flags">
      <CheckCircle2 className="mt-0.5 shrink-0 text-[hsl(var(--chart-2))]" size={19} />
      <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">This message did not trip the patterns I know. Still verify the sender independently before sharing money or sensitive details.</p>
    </div>
  );
}

function AsideCard({ status, result }: { status: string; result: { flags: ScamFlag[] } | null }) {
  if (status === "result" && result) {
    return (
      <div className="rounded-[22px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] sm:p-8" data-testid="card-next-step">
        <div className="flex items-center justify-between">
          <div className="mono-type text-[10px] font-bold uppercase text-[hsl(var(--accent))]">Your next move</div>
          <Sparkles size={18} className="text-[hsl(var(--accent))]" />
        </div>
        <h2 className="display-type mt-8 max-w-[330px] text-4xl leading-[.94] sm:text-5xl">Pause before you pay.</h2>
        <p className="mt-6 max-w-[370px] text-sm leading-6 text-[hsl(var(--primary-foreground)/.68)]">{result.flags.length ? "Do not reply with money or personal information. Search the company name yourself, then contact them through a verified website." : "A clean scan is not a guarantee. Find the company’s real contact details yourself and ask specific questions about the role."}</p>
        <div className="mt-8 flex items-center gap-2 border-t border-[hsl(var(--primary-foreground)/.16)] pt-4 text-xs font-bold text-[hsl(var(--accent))]"><Info size={15} /> If it feels rushed, it can wait.</div>
      </div>
    );
  }
  return (
    <div className="rounded-[22px] border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.5)] p-6 sm:p-8" data-testid="card-what-we-check">
      <div className="mono-type text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">A useful gut check</div>
      <h2 className="display-type mt-3 max-w-[320px] text-4xl leading-[.94] text-[hsl(var(--primary))]">If it needs your money, it needs your questions.</h2>
      <div className="mt-7 space-y-4">
        <CheckItem icon="01" title="Upfront payments" copy="Registration, training, processing, or “unlocking” fees." />
        <CheckItem icon="02" title="Artificial urgency" copy="Deadlines that stop you from doing a quick independent check." />
        <CheckItem icon="03" title="Big promises" copy="Unusually high pay for simple work or guaranteed returns." />
      </div>
    </div>
  );
}

function CheckItem({ icon, title, copy }: { icon: string; title: string; copy: string }) {
  return (
    <div className="flex gap-3" data-testid={`item-check-${icon}`}>
      <span className="mono-type flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--card))] text-[9px] font-bold text-[hsl(var(--destructive))]">{icon}</span>
      <div><h3 className="text-sm font-black text-[hsl(var(--primary))]">{title}</h3><p className="mt-0.5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{copy}</p></div>
    </div>
  );
}

function HowRow({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[70px_180px_1fr] sm:items-baseline sm:gap-4" data-testid={`row-how-${number}`}>
      <span className="mono-type text-[10px] font-bold text-[hsl(var(--destructive))]">{number}</span>
      <h3 className="text-base font-black text-[hsl(var(--primary))]">{title}</h3>
      <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p>
    </div>
  );
}

function riskDetails(level: RiskLevel) {
  if (level === "high") return { title: "This is looking risky.", label: "High risk", color: "hsl(7 73% 48%)", summary: "Several strong warning signs showed up. Treat this offer as unsafe until you can prove otherwise." };
  if (level === "medium") return { title: "Proceed with your eyes open.", label: "Worth a closer look", color: "hsl(28 65% 43%)", summary: "A few patterns deserve a pause. Do not send money or personal details until you verify the sender." };
  return { title: "Nothing obvious jumped out.", label: "Lower risk", color: "hsl(161 42% 34%)", summary: "This message looks less like the common scams I check for, but a clean scan is not a guarantee." };
}

function flagTone(severity: ScamFlag["severity"]) {
  if (severity === "danger") return { label: "serious", color: "hsl(7 73% 48%)", background: "hsl(7 73% 48% / .1)", icon: <ShieldAlert size={15} /> };
  if (severity === "warning") return { label: "caution", color: "hsl(28 65% 43%)", background: "hsl(28 65% 51% / .13)", icon: <AlertTriangle size={15} /> };
  return { label: "watch", color: "hsl(214 40% 42%)", background: "hsl(214 40% 42% / .1)", icon: <Info size={15} /> };
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
