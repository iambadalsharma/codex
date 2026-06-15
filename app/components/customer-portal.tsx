"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FilePlus2,
  FolderOpen,
  Gauge,
  Languages,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  LogOut,
  Moon,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Upload,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  calculateDashboardStats,
  demoCustomer,
  initialOrders,
  initialTenders,
  orderColumns,
  serviceHighlights,
  tenderColumns,
  type CustomerProfile,
  type OrderRow,
  type TenderRow,
} from "@/lib/tender-data";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Language = "en" | "hi";
type Theme = "light" | "dark";
type PublicPage = "home" | "features" | "growth" | "pricing" | "resources";
type ViewKey = "dashboard" | "tenders" | "orders" | "folders" | "analysis" | "alerts" | "team";
type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

type IconType = typeof LayoutDashboard;

const copy = {
  en: {
    brand: "Tender Saathi",
    tagline: "Tender growth and order control desk",
    login: "Login",
    signup: "Sign up",
    language: "Hindi",
    nav: {
      home: "Home",
      features: "Features",
      growth: "Growth plan",
      pricing: "Plans",
      resources: "Resources",
    },
    heroLabel: "Tender growth platform",
    heroTitle: "Find, file, track, and win more tenders from one simple customer dashboard.",
    heroText:
      "Tender Saathi keeps tender dates, documents, team work, orders, BG status, and growth analysis in one place so business owners can act without confusion.",
    primaryCta: "Create account",
    secondaryCta: "Open dashboard",
    sideTitle: "Owner-friendly access",
    sideText: "Every customer gets a unique ID, private tender folders, dashboard exports, and clear alerts.",
    dashboardPreview: "Dashboard preview",
    previewTitle: "What the customer sees after login",
    previewText:
      "Tender counts, due dates, order follow-up, document folders, risk alerts, and growth recommendations are visible without extra training.",
    dashboard: "Dashboard",
    tenders: "Tenders",
    orders: "Orders",
    folders: "Folders",
    analysis: "Analysis",
    alerts: "Alerts",
    team: "Team",
    excel: "Excel download",
    csv: "CSV download",
    logout: "Logout",
    addTender: "Add tender",
    tenderNumber: "Tender number",
    tenderTitle: "Tender title",
    tenderPdf: "Tender PDF",
    addAndFolder: "Add and create folder",
    dueList: "Due tender list",
    dueHelp: "See which tender is due soon and which stage needs action.",
    fullList: "Full list",
    searchTender: "Search tender",
    recordsVisible: "records visible",
    customerId: "Customer ID",
    ownerName: "Owner name",
    firmName: "Company / Firm name",
    mobile: "Mobile",
    email: "Email",
    createId: "Create customer ID",
    openDashboard: "Open dashboard",
    orderSummary: "Order summary",
    folderBase: "Base folder",
    files: "Files",
  },
  hi: {
    brand: "Tender Saathi",
    tagline: "Tender growth aur order control desk",
    login: "Login",
    signup: "Sign up",
    language: "English",
    nav: {
      home: "Home",
      features: "Features",
      growth: "Growth plan",
      pricing: "Plans",
      resources: "Help",
    },
    heroLabel: "Tender growth platform",
    heroTitle: "Ek simple dashboard se tender dhoondho, file karo, track karo aur zyada tender jeeto.",
    heroText:
      "Tender Saathi me due date, documents, team ka kaam, orders, BG status aur growth analysis ek jagah dikhta hai, taaki owner bina confusion ke decision le sake.",
    primaryCta: "Naya account",
    secondaryCta: "Dashboard kholein",
    sideTitle: "Owner ke liye easy access",
    sideText: "Har customer ko unique ID, private tender folders, dashboard export aur clear alerts milte hain.",
    dashboardPreview: "Dashboard preview",
    previewTitle: "Login ke baad customer ko kya dikhega",
    previewText:
      "Tender count, due date, order follow-up, document folders, risk alerts aur growth recommendations bina training ke samajh aate hain.",
    dashboard: "Dashboard",
    tenders: "Tenders",
    orders: "Orders",
    folders: "Folders",
    analysis: "Analysis",
    alerts: "Alerts",
    team: "Team",
    excel: "Excel download",
    csv: "CSV download",
    logout: "Logout",
    addTender: "Tender add karein",
    tenderNumber: "Tender number",
    tenderTitle: "Tender title",
    tenderPdf: "Tender PDF",
    addAndFolder: "Add karein aur folder banayein",
    dueList: "Due tender list",
    dueHelp: "Kaunsa tender jaldi due hai aur kis stage par action chahiye.",
    fullList: "Full list",
    searchTender: "Tender search",
    recordsVisible: "records visible",
    customerId: "Customer ID",
    ownerName: "Owner name",
    firmName: "Company / Firm name",
    mobile: "Mobile",
    email: "Email",
    createId: "Customer ID banayein",
    openDashboard: "Dashboard kholein",
    orderSummary: "Order summary",
    folderBase: "Base folder",
    files: "Files",
  },
} satisfies Record<Language, Record<string, unknown>>;

const publicPages: PublicPage[] = ["home", "features", "growth", "pricing", "resources"];

const dashboardIcons: Record<ViewKey, IconType> = {
  dashboard: LayoutDashboard,
  tenders: ClipboardList,
  orders: PackageCheck,
  folders: FolderOpen,
  analysis: BarChart3,
  alerts: Bell,
  team: UsersRound,
};

const growthCards = [
  {
    metric: "72%",
    title: "Tender fit score",
    titleHi: "Tender fit score",
    text: "Best-fit opportunities are separated from risky bids before effort starts.",
    textHi: "Risky bids aur best-fit opportunities ko kaam shuru hone se pehle alag dikhaya jata hai.",
    icon: Gauge,
    tone: "text-blue-700",
  },
  {
    metric: "3.4 Cr",
    title: "Open pipeline",
    titleHi: "Open pipeline",
    text: "Expected value across working and upcoming tenders.",
    textHi: "Working aur upcoming tenders ki expected value.",
    icon: Target,
    tone: "text-emerald-700",
  },
  {
    metric: "4",
    title: "Risk alerts",
    titleHi: "Risk alerts",
    text: "EMD, BG, pre-bid and submission follow-up reminders.",
    textHi: "EMD, BG, pre-bid aur submission follow-up reminders.",
    icon: AlertCircle,
    tone: "text-red-700",
  },
  {
    metric: "18%",
    title: "Quote gap",
    titleHi: "Quote gap",
    text: "Difference between quoted value and known winning history.",
    textHi: "Quoted value aur winning history ke beech ka gap.",
    icon: Lightbulb,
    tone: "text-amber-700",
  },
];

const growthRecommendations = [
  {
    title: "Focus on municipal security tenders",
    titleHi: "Municipal security tenders par focus karein",
    text: "Your active order history and documents match upcoming CCTV and command-center tenders.",
    textHi: "Aapki order history aur documents upcoming CCTV aur command-center tenders se match karte hain.",
  },
  {
    title: "Reduce missed tender risk",
    titleHi: "Missed tender risk kam karein",
    text: "Move EMD readiness and turnover checks to the first day after tender discovery.",
    textHi: "Tender milte hi pehle din EMD readiness aur turnover check complete karein.",
  },
  {
    title: "Build a reusable compliance pack",
    titleHi: "Reusable compliance pack banayein",
    text: "GST, PAN, turnover, OEM, BG and past-work files should be folder-ready for every tender.",
    textHi: "GST, PAN, turnover, OEM, BG aur past-work files har tender folder me ready hone chahiye.",
  },
];

const alerts = [
  { title: "GEM/2026/B/44721", text: "Commercial value pending. Submission closes in 11 days.", level: "High" },
  { title: "BG-SBI-55201", text: "BG collected status is pending for Solar EPC order.", level: "Medium" },
  { title: "UPLC/SMART/2026/118", text: "Pre-bid query date is approaching. Assign owner today.", level: "Medium" },
  { title: "MJP/SCADA/2026/88", text: "Marked missed. Capture reason for future qualification filter.", level: "Low" },
];

const teamTasks = [
  { owner: "Owner", task: "Approve final commercial quote", status: "Today" },
  { owner: "Accounts", task: "Prepare EMD and BG documents", status: "Pending" },
  { owner: "Technical", task: "Check SoW compliance and deviations", status: "Working" },
  { owner: "Tender desk", task: "Upload final bid and save proof", status: "Next" },
];

const competitorRows = [
  { name: "Local Infra Systems", lastQuote: "INR 1.78 Cr", winRate: "34%", signal: "Usually underquotes service margin" },
  { name: "North City Tech", lastQuote: "INR 1.92 Cr", winRate: "28%", signal: "Strong on CCTV but slow on BG compliance" },
  { name: "Prime Secure", lastQuote: "INR 1.83 Cr", winRate: "41%", signal: "Good municipal references" },
];

const pricingPlans = [
  {
    name: "Starter Desk",
    price: "INR 4,999/mo",
    text: "Small owners who need tender dates, folders, and basic order tracking.",
  },
  {
    name: "Growth Desk",
    price: "INR 11,999/mo",
    text: "Teams that need alerts, quote analysis, task tracking, and monthly reports.",
  },
  {
    name: "Managed Desk",
    price: "Custom",
    text: "Full tender operations with document preparation, follow-up, and result analysis.",
  },
];

const resources = [
  "Tender readiness checklist",
  "EMD and BG document tracker",
  "Pre-bid query template",
  "Order delivery and CRAC follow-up checklist",
  "Monthly win-loss review format",
];

function c(language: Language) {
  return copy[language] as Record<string, string> & {
    nav: Record<PublicPage, string>;
  };
}

function makeCustomerId(name: string, businessName: string) {
  const source = `${businessName || name || "Customer"}`.replace(/[^a-zA-Z0-9]/g, "");
  const prefix = source.slice(0, 4).toUpperCase().padEnd(4, "X");
  const number = Math.floor(1000 + Math.random() * 9000);
  return `CUST-${prefix}-${number}`;
}

function safeFolderName(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

function csvSafe(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function moneyToNumber(value: string) {
  const normalized = value.toLowerCase().replace(/inr|,|\s/g, "");
  const amount = Number.parseFloat(normalized.replace(/cr|lakh/g, ""));

  if (Number.isNaN(amount)) {
    return 0;
  }

  if (normalized.includes("cr")) {
    return amount * 10000000;
  }

  if (normalized.includes("lakh")) {
    return amount * 100000;
  }

  return amount;
}

function formatCurrencyShort(value: number) {
  if (value >= 10000000) {
    return `INR ${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `INR ${(value / 100000).toFixed(1)} L`;
  }

  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

function getStatusTone(status: TenderRow["currentStatus"] | string) {
  if (status === "Filed" || status === "Won" || status === "Active" || status === "Done") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "Working" || status === "Work in progress") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "Upcoming" || status === "Material dispatch pending" || status === "Pending") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (status === "Missed" || status === "Lost" || status === "High") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; label: string }>
) {
  const header = columns.map((column) => csvSafe(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => csvSafe(row[column.key])).join(","))
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function LanguageButton({
  language,
  onToggle,
}: {
  language: Language;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
      aria-label="Change language"
      title="Change language"
    >
      <Languages className="h-4 w-4" />
      {c(language).language}
    </button>
  );
}

function ThemeButton({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="glass-button inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold"
      aria-label="Change theme"
      title="Change theme"
    >
      <Icon className="h-4 w-4" />
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

function AuthDrawer({
  mode,
  language,
  theme,
  onClose,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  language: Language;
  theme: Theme;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (profile: CustomerProfile) => void;
}) {
  const t = c(language);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  async function saveCustomerProfile(profile: CustomerProfile, userId: string) {
    const { error } = await supabase.from("customers").upsert({
      id: userId,
      customer_id: profile.customerId,
      owner_name: profile.ownerName,
      business_name: profile.businessName,
      phone: profile.phone,
      email: profile.email,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Customer profile was not saved yet. Run the Supabase SQL setup first.", error.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const ownerName = String(formData.get("ownerName") || demoCustomer.ownerName);
    const businessName = String(formData.get("businessName") || demoCustomer.businessName);
    const phone = String(formData.get("phone") || demoCustomer.phone).trim();
    const email = String(formData.get("email") || demoCustomer.email).trim();
    const password = String(formData.get("password") || "").trim();
    const otp = String(formData.get("otp") || "").trim();
    const customerId =
      mode === "signup"
        ? makeCustomerId(ownerName, businessName)
        : String(formData.get("customerId") || demoCustomer.customerId).trim();

    const profile = {
      customerId: customerId || demoCustomer.customerId,
      ownerName,
      businessName,
      phone,
      email,
    };

    try {
      if (authMethod === "phone") {
        const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;

        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
            options: {
              data: {
                business_name: businessName,
                customer_id: profile.customerId,
                owner_name: ownerName,
              },
            },
          });

          if (error) {
            throw error;
          }

          setOtpSent(true);
          setAuthMessage(
            language === "hi"
              ? "OTP bhej diya gaya hai. Code daal kar login complete karein."
              : "OTP sent. Enter the code to complete login."
          );
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: "sms",
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await saveCustomerProfile(profile, data.user.id);
        }
      } else if (mode === "signup") {
        if (!password || password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              customer_id: profile.customerId,
              owner_name: ownerName,
              phone,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await saveCustomerProfile(profile, data.user.id);
        }
      } else {
        if (!password) {
          throw new Error("Enter your password to login.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await saveCustomerProfile(profile, data.user.id);
        }
      }

      onSubmit(profile);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-overlay" data-theme={theme}>
      <div
        className="auth-drawer glass-panel ml-auto flex h-full w-full max-w-md flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Customer access</p>
            <h2 className="text-2xl font-semibold text-zinc-950">
              {mode === "signup" ? t.signup : t.login}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-zinc-200 p-2">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold ${
              mode === "login" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <LogIn className="h-4 w-4" />
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("signup")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold ${
              mode === "signup" ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {t.signup}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 rounded-md border border-zinc-200 bg-white/40 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setOtpSent(false);
                setAuthError("");
                setAuthMessage("");
              }}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${
                authMethod === "email" ? "bg-zinc-950 text-white" : "text-zinc-700"
              }`}
            >
              Email password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setOtpSent(false);
                setAuthError("");
                setAuthMessage("");
              }}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${
                authMethod === "phone" ? "bg-zinc-950 text-white" : "text-zinc-700"
              }`}
            >
              Mobile OTP
            </button>
          </div>

          {mode === "login" ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.customerId}</span>
              <input
                name="customerId"
                placeholder="CUST-2047"
                className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-700">{t.ownerName}</span>
            <input
              name="ownerName"
              placeholder="Rajesh Kumar"
              className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-zinc-700">{t.firmName}</span>
            <input
              name="businessName"
              placeholder="RK Engineering Works"
              className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.mobile}</span>
              <input
                name="phone"
                placeholder="9876543210"
                className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.email}</span>
              <input
                name="email"
                type="email"
                placeholder="owner@example.com"
                required={authMethod === "email"}
                className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
          </div>

          {authMethod === "email" ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">Password</span>
              <input
                name="password"
                type="password"
                minLength={mode === "signup" ? 6 : undefined}
                placeholder={mode === "signup" ? "Create 6+ character password" : "Enter password"}
                required
                className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
          ) : null}

          {authMethod === "phone" && otpSent ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">OTP code</span>
              <input
                name="otp"
                inputMode="numeric"
                placeholder="123456"
                required
                className="h-12 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
          ) : null}

          {mode === "signup" ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {language === "hi"
                ? "Sign up ke baad unique Customer ID banegi. Isi ID se dashboard aur tender folders linked rahenge."
                : "A unique customer ID will be created. The dashboard and tender folders stay linked to that ID."}
            </div>
          ) : null}

          {authMessage ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
              {authMessage}
            </div>
          ) : null}

          {authError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {authError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-base font-semibold text-white hover:bg-zinc-800"
          >
            {mode === "signup" ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            {isSubmitting
              ? "Please wait..."
              : authMethod === "phone" && !otpSent
                ? "Send OTP"
                : mode === "signup"
                  ? t.createId
                  : t.openDashboard}
          </button>
        </form>
      </div>
    </div>
  );
}

function profileFromSupabaseUser(user: User): CustomerProfile {
  const metadata = user.user_metadata;
  const ownerName = String(metadata.owner_name || demoCustomer.ownerName);
  const businessName = String(metadata.business_name || demoCustomer.businessName);

  return {
    customerId: String(metadata.customer_id || makeCustomerId(ownerName, businessName)),
    ownerName,
    businessName,
    phone: user.phone || String(metadata.phone || demoCustomer.phone),
    email: user.email || String(metadata.email || demoCustomer.email),
  };
}

function PublicHome({
  language,
  theme,
  onLanguageToggle,
  onThemeToggle,
  onAuthOpen,
}: {
  language: Language;
  theme: Theme;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onAuthOpen: (mode: AuthMode) => void;
}) {
  const [page, setPage] = useState<PublicPage>("home");
  const t = c(language);

  return (
    <main className="ios-shell min-h-screen text-zinc-950" data-theme={theme}>
      <header className="glass-nav sticky top-0 z-20 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                {t.brand}
              </p>
              <p className="text-xs text-zinc-500">{t.tagline}</p>
            </div>
            <div className="flex gap-2 lg:hidden">
              <ThemeButton theme={theme} onToggle={onThemeToggle} />
              <LanguageButton language={language} onToggle={onLanguageToggle} />
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-1">
            {publicPages.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`h-10 whitespace-nowrap rounded-md px-3 text-sm font-semibold ${
                  page === item ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-white"
                }`}
              >
                {t.nav[item]}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden gap-2 lg:flex">
              <ThemeButton theme={theme} onToggle={onThemeToggle} />
              <LanguageButton language={language} onToggle={onLanguageToggle} />
            </div>
            <button
              type="button"
              onClick={() => onAuthOpen("login")}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              <LogIn className="h-4 w-4" />
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => onAuthOpen("signup")}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <UserPlus className="h-4 w-4" />
              {t.signup}
            </button>
          </div>
        </div>
      </header>

      {page === "home" ? <PublicHomePage language={language} onAuthOpen={onAuthOpen} /> : null}
      {page === "features" ? <FeaturePage language={language} /> : null}
      {page === "growth" ? <GrowthPage language={language} onAuthOpen={onAuthOpen} /> : null}
      {page === "pricing" ? <PricingPage language={language} onAuthOpen={onAuthOpen} /> : null}
      {page === "resources" ? <ResourcesPage language={language} /> : null}
    </main>
  );
}

function PublicHomePage({
  language,
  onAuthOpen,
}: {
  language: Language;
  onAuthOpen: (mode: AuthMode) => void;
}) {
  const t = c(language);

  return (
    <>
      <section className="border-b border-zinc-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-blue-700">{t.heroLabel}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-zinc-950 sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">{t.heroText}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAuthOpen("signup")}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-emerald-700 px-5 text-base font-semibold text-white hover:bg-emerald-800"
              >
                <UserPlus className="h-5 w-5" />
                {t.primaryCta}
              </button>
              <button
                type="button"
                onClick={() => onAuthOpen("login")}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-zinc-300 bg-white px-5 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
              >
                <LogIn className="h-5 w-5" />
                {t.secondaryCta}
              </button>
            </div>
          </div>

          <aside className="border-l-4 border-emerald-600 bg-emerald-50 p-5">
            <p className="text-sm font-semibold uppercase text-emerald-800">Access</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{t.sideTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">{t.sideText}</p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => onAuthOpen("login")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <LogIn className="h-4 w-4" />
                {t.login}
              </button>
              <button
                type="button"
                onClick={() => onAuthOpen("signup")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <UserPlus className="h-4 w-4" />
                {t.signup}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {serviceHighlights.map((item) => (
              <article key={item.title} className="rounded-lg border border-zinc-200 bg-white p-5">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                <h2 className="mt-4 text-lg font-semibold text-zinc-950">
                  {language === "hi" ? item.titleHi ?? item.title : item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {language === "hi" ? item.textHi ?? item.text : item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[340px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">{t.dashboardPreview}</p>
            <h2 className="mt-2 text-3xl font-semibold text-zinc-950">{t.previewTitle}</h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">{t.previewText}</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid gap-px bg-zinc-200 sm:grid-cols-4">
              {[
                ["Live tender", "1"],
                ["Upcoming", "1"],
                ["Filed", "1"],
                ["Missed", "1"],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-5">
                  <p className="text-sm text-zinc-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-zinc-50 p-5">
              <div className="grid gap-3 md:grid-cols-3">
                {["Tender add", "Excel download", "Growth analysis"].map((label) => (
                  <div key={label} className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FeaturePage({ language }: { language: Language }) {
  const featureRows = [
    ["Tender discovery", "Tender number, PDF, due date, EMD and pre-bid tracking."],
    ["Execution workflow", "To apply, not apply, applied, filed and missed stages with remarks."],
    ["Document vault", "Separate folder for every tender with file links for the customer team."],
    ["Order operations", "Contract, BG, courier, CRAC and pending work in one panel."],
    ["Alerts", "Due date, EMD, BG, pre-bid and team reminder alerts."],
    ["Reports", "Excel and CSV download for owner, accounts and tender team."],
  ];

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-blue-700">Features</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-950">
            {language === "hi" ? "Tender ka poora kaam ek jagah." : "Everything needed to run tender work in one place."}
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600">
            {language === "hi"
              ? "Listing se lekar filing, order follow-up aur documents tak workflow simple rakha gaya hai."
              : "From discovery to filing, order follow-up, and documents, the workflow stays simple and visible."}
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureRows.map(([title, text]) => (
            <article key={title} className="rounded-lg border border-zinc-200 bg-white p-5">
              <ShieldCheck className="h-6 w-6 text-emerald-700" />
              <h2 className="mt-4 text-lg font-semibold text-zinc-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthPage({
  language,
  onAuthOpen,
}: {
  language: Language;
  onAuthOpen: (mode: AuthMode) => void;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Growth analysis</p>
            <h1 className="mt-2 text-4xl font-semibold text-zinc-950">
              {language === "hi" ? "Sirf tender list nahi, growth decision bhi." : "Not just a tender list, a growth decision desk."}
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600">
              {language === "hi"
                ? "Owner ko pata chale kaunsa tender apply karna hai, kaunsa avoid karna hai, aur kis kaam se win chance badhega."
                : "Owners can see which tender to pursue, which one to avoid, and which action improves win chances."}
            </p>
            <button
              type="button"
              onClick={() => onAuthOpen("signup")}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-emerald-700 px-5 text-base font-semibold text-white hover:bg-emerald-800"
            >
              <UserPlus className="h-5 w-5" />
              {language === "hi" ? "Growth dashboard shuru karein" : "Start growth dashboard"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {growthCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-lg border border-zinc-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className={`h-6 w-6 ${card.tone}`} />
                    <p className="text-3xl font-semibold text-zinc-950">{card.metric}</p>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-zinc-950">
                    {language === "hi" ? card.titleHi : card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {language === "hi" ? card.textHi : card.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingPage({
  language,
  onAuthOpen,
}: {
  language: Language;
  onAuthOpen: (mode: AuthMode) => void;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-blue-700">Plans</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-950">
            {language === "hi" ? "Customer size ke hisaab se simple plans." : "Simple plans by customer maturity."}
          </h1>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-zinc-200 bg-white p-5">
              <h2 className="text-xl font-semibold text-zinc-950">{plan.name}</h2>
              <p className="mt-3 text-3xl font-semibold text-emerald-700">{plan.price}</p>
              <p className="mt-4 text-sm leading-6 text-zinc-600">{plan.text}</p>
              <button
                type="button"
                onClick={() => onAuthOpen("signup")}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                {language === "hi" ? "Plan choose karein" : "Choose plan"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourcesPage({ language }: { language: Language }) {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-blue-700">Resources</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-950">
            {language === "hi" ? "Owner aur team ke liye ready formats." : "Ready formats for owners and tender teams."}
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600">
            {language === "hi"
              ? "Ye formats dashboard ke document folders me attach kiye ja sakte hain."
              : "These formats can be attached inside dashboard document folders."}
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <article key={resource} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-5">
              <BookOpenCheck className="h-6 w-6 text-emerald-700" />
              <p className="font-semibold text-zinc-900">{resource}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  customer,
  language,
  theme,
  onLanguageToggle,
  onThemeToggle,
  onLogout,
}: {
  customer: CustomerProfile;
  language: Language;
  theme: Theme;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [tenders, setTenders] = useState<TenderRow[]>(initialTenders);
  const [orders] = useState<OrderRow[]>(initialOrders);
  const [query, setQuery] = useState("");
  const stats = useMemo(() => calculateDashboardStats(tenders), [tenders]);
  const t = c(language);

  const visibleTenders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return tenders;
    }

    return tenders.filter((tender) =>
      [
        tender.tenderNumber,
        tender.tenderTitle,
        tender.organisation,
        tender.location,
        tender.currentStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, tenders]);

  const pipelineValue = useMemo(() => {
    return tenders
      .filter((tender) => ["Live", "Upcoming", "Working"].includes(tender.currentStatus))
      .reduce((sum, tender) => sum + moneyToNumber(tender.tenderValue), 0);
  }, [tenders]);

  function downloadDashboardExcel() {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        tenders.map((tender) =>
          Object.fromEntries(tenderColumns.map((column) => [column.label, tender[column.key]]))
        )
      ),
      "Tenders"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        orders.map((order) =>
          Object.fromEntries(orderColumns.map((column) => [column.label, order[column.key]]))
        )
      ),
      "Orders"
    );
    XLSX.writeFile(workbook, `${customer.customerId}-dashboard.xlsx`);
  }

  function downloadTenderCsv() {
    const csv = buildCsv(
      visibleTenders as unknown as Array<Record<string, unknown>>,
      tenderColumns as Array<{ key: string; label: string }>
    );
    downloadFile(`${customer.customerId}-tenders.csv`, csv, "text/csv;charset=utf-8");
  }

  function handleAddTender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const pdf = formData.get("pdfFile") as File | null;
    const rawNumber = String(formData.get("tenderNumber") || "").trim();
    const tenderNumber = rawNumber || `TENDER-${Date.now().toString().slice(-6)}`;
    const uploadedName = pdf?.name ? pdf.name.replace(/\.[^.]+$/, "") : "";
    const title =
      String(formData.get("tenderTitle") || "").trim() ||
      uploadedName.replace(/[-_]+/g, " ") ||
      "New tender added by customer";
    const folderName = safeFolderName(tenderNumber);
    const nextSerial = Math.max(...tenders.map((tender) => tender.serialNo), 0) + 1;
    const newTender: TenderRow = {
      serialNo: nextSerial,
      remarks: pdf?.name ? `PDF uploaded: ${pdf.name}` : "Added from tender number",
      publishedDate: "2026-06-13",
      submissionEndDate: "2026-06-30",
      preBidDate: "To update",
      preBidLocation: "To update",
      toBeApplied: "Decide",
      notApplyingReason: "-",
      applied: "No",
      dueDays: 17,
      tenderNumber,
      tenderTitle: title,
      consignee: "To update",
      organisation: "To update",
      location: "To update",
      emdValue: "To update",
      ra: "No",
      tenderValue: "To update",
      ourQuotedValue: "-",
      result: "Pending",
      winningValue: "-",
      tenderLink: "#",
      currentStatus: "Live",
      folderLink: `/folders/${customer.customerId}/${folderName}`,
    };

    setTenders((current) => [newTender, ...current]);
    setActiveView("tenders");
    form.reset();
  }

  const viewItems: Array<{ key: ViewKey; label: string; icon: IconType }> = [
    { key: "dashboard", label: t.dashboard, icon: dashboardIcons.dashboard },
    { key: "tenders", label: t.tenders, icon: dashboardIcons.tenders },
    { key: "orders", label: t.orders, icon: dashboardIcons.orders },
    { key: "folders", label: t.folders, icon: dashboardIcons.folders },
    { key: "analysis", label: t.analysis, icon: dashboardIcons.analysis },
    { key: "alerts", label: t.alerts, icon: dashboardIcons.alerts },
    { key: "team", label: t.team, icon: dashboardIcons.team },
  ];

  return (
    <main className="ios-shell min-h-screen text-zinc-950" data-theme={theme}>
      <header className="glass-nav px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setActiveView("dashboard")}
              className="inline-flex items-center gap-2 text-left text-sm font-semibold text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.brand}
            </button>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">{customer.businessName}</h1>
            <p className="text-sm text-zinc-500">
              {t.customerId}: <span className="font-mono text-zinc-800">{customer.customerId}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeButton theme={theme} onToggle={onThemeToggle} />
            <LanguageButton language={language} onToggle={onLanguageToggle} />
            <button
              type="button"
              onClick={downloadDashboardExcel}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              {t.excel}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-2">
            {viewItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`inline-flex h-12 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold ${
                    isActive ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeView === "dashboard" ? (
            <DashboardOverview
              language={language}
              stats={stats}
              tenders={tenders}
              orders={orders}
              query={query}
              pipelineValue={pipelineValue}
              onQueryChange={setQuery}
              onAddTender={handleAddTender}
              onDownloadTenderCsv={downloadTenderCsv}
              onOpenTenders={() => setActiveView("tenders")}
              visibleTenders={visibleTenders}
            />
          ) : null}

          {activeView === "tenders" ? (
            <TenderTable
              language={language}
              tenders={visibleTenders}
              query={query}
              onQueryChange={setQuery}
              onDownloadTenderCsv={downloadTenderCsv}
            />
          ) : null}

          {activeView === "orders" ? <OrderTable language={language} orders={orders} /> : null}

          {activeView === "folders" ? (
            <FolderGrid language={language} customer={customer} tenders={tenders} />
          ) : null}

          {activeView === "analysis" ? (
            <AnalysisView language={language} tenders={tenders} pipelineValue={pipelineValue} />
          ) : null}

          {activeView === "alerts" ? <AlertsView language={language} /> : null}

          {activeView === "team" ? <TeamView language={language} /> : null}
        </section>
      </div>
    </main>
  );
}

function DashboardOverview({
  language,
  stats,
  tenders,
  orders,
  query,
  visibleTenders,
  pipelineValue,
  onQueryChange,
  onAddTender,
  onDownloadTenderCsv,
  onOpenTenders,
}: {
  language: Language;
  stats: ReturnType<typeof calculateDashboardStats>;
  tenders: TenderRow[];
  orders: OrderRow[];
  query: string;
  visibleTenders: TenderRow[];
  pipelineValue: number;
  onQueryChange: (value: string) => void;
  onAddTender: (event: FormEvent<HTMLFormElement>) => void;
  onDownloadTenderCsv: () => void;
  onOpenTenders: () => void;
}) {
  const t = c(language);
  const dueSoon = tenders
    .filter((tender) => tender.dueDays >= 0)
    .sort((a, b) => a.dueDays - b.dueDays)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {[
          ["Live tender data", stats.live, BarChart3, "text-blue-700"],
          ["Upcoming tenders", stats.upcoming, CalendarClock, "text-amber-700"],
          ["Working tenders", stats.working, ClipboardList, "text-cyan-700"],
          ["Total filed", stats.filed, CheckCircle2, "text-emerald-700"],
          ["Missed tenders", stats.missed, AlertTriangle, "text-red-700"],
          ["Pipeline value", formatCurrencyShort(pipelineValue), Target, "text-indigo-700"],
        ].map(([label, value, Icon, tone]) => (
          <article key={String(label)} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-600">{label as string}</p>
              <Icon className={`h-5 w-5 ${tone as string}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-zinc-950">{String(value)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">{t.dueList}</h2>
              <p className="text-sm text-zinc-500">{t.dueHelp}</p>
            </div>
            <button
              type="button"
              onClick={onOpenTenders}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              <ClipboardList className="h-4 w-4" />
              {t.fullList}
            </button>
          </div>
          <div className="divide-y divide-zinc-200">
            {dueSoon.map((tender) => (
              <article key={tender.tenderNumber} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px] md:items-center">
                <div>
                  <p className="font-semibold text-zinc-950">{tender.tenderTitle}</p>
                  <p className="mt-1 text-sm text-zinc-500">{tender.tenderNumber}</p>
                </div>
                <span className={`inline-flex w-fit rounded-md border px-3 py-1 text-sm font-semibold ${getStatusTone(tender.currentStatus)}`}>
                  {tender.currentStatus}
                </span>
                <p className="text-sm font-semibold text-zinc-900">
                  {tender.dueDays === 0 ? "Today" : `${tender.dueDays} days`}
                </p>
              </article>
            ))}
          </div>
        </section>

        <form onSubmit={onAddTender} className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-semibold text-zinc-950">{t.addTender}</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.tenderNumber}</span>
              <input
                name="tenderNumber"
                placeholder="GEM/2026/B/00000"
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.tenderTitle}</span>
              <input
                name="tenderTitle"
                placeholder={language === "hi" ? "PDF title blank ho to yahan add karein" : "Add title if PDF is blank"}
                className="h-11 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-zinc-700">{t.tenderPdf}</span>
              <input
                name="pdfFile"
                type="file"
                accept=".pdf"
                className="w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-700"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Upload className="h-4 w-4" />
            {t.addAndFolder}
          </button>
        </form>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">{t.searchTender}</h2>
            <p className="text-sm text-zinc-500">
              {visibleTenders.length} {t.recordsVisible}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadTenderCsv}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            <Download className="h-4 w-4" />
            Tender CSV
          </button>
        </div>
        <label className="mt-4 flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={language === "hi" ? "Tender number, organisation, location ya status" : "Tender number, organisation, location or status"}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-blue-700" />
          <h2 className="text-xl font-semibold text-zinc-950">{t.orderSummary}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {orders.map((order) => (
            <article key={order.contractNo} className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-950">{order.work}</p>
                  <p className="mt-1 text-sm text-zinc-500">{order.contractNo}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${getStatusTone(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Order value</dt>
                  <dd className="font-semibold text-zinc-950">{order.totalOrderValue}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">BG status</dt>
                  <dd className="font-semibold text-zinc-950">{order.bgStatus}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TenderTable({
  language,
  tenders,
  query,
  onQueryChange,
  onDownloadTenderCsv,
}: {
  language: Language;
  tenders: TenderRow[];
  query: string;
  onQueryChange: (value: string) => void;
  onDownloadTenderCsv: () => void;
}) {
  const t = c(language);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">{t.tenders}</h2>
          <p className="text-sm text-zinc-500">
            {language === "hi" ? "Customer-wise tender tracker" : "Customer-wise tender tracker"}
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadTenderCsv}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          {t.csv}
        </button>
      </div>
      <div className="border-b border-zinc-200 p-4">
        <label className="flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.searchTender}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <DataTable rows={tenders} columns={tenderColumns} />
    </section>
  );
}

function OrderTable({ language, orders }: { language: Language; orders: OrderRow[] }) {
  const t = c(language);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-4">
        <h2 className="text-2xl font-semibold text-zinc-950">{t.orders}</h2>
        <p className="text-sm text-zinc-500">Order, BG, courier aur CRAC status</p>
      </div>
      <DataTable rows={orders} columns={orderColumns} />
    </section>
  );
}

function AnalysisView({
  language,
  tenders,
  pipelineValue,
}: {
  language: Language;
  tenders: TenderRow[];
  pipelineValue: number;
}) {
  const winReady = tenders.filter((tender) => tender.currentStatus === "Working" || tender.currentStatus === "Filed").length;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-700" />
          <h2 className="text-2xl font-semibold text-zinc-950">
            {language === "hi" ? "Growth analysis" : "Growth analysis"}
          </h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MetricTile title="Pipeline value" value={formatCurrencyShort(pipelineValue)} />
          <MetricTile title="Win-ready tenders" value={String(winReady)} />
          <MetricTile title="Average fit score" value="72%" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-xl font-semibold text-zinc-950">
            {language === "hi" ? "Recommended actions" : "Recommended actions"}
          </h3>
          <div className="mt-4 space-y-3">
            {growthRecommendations.map((item) => (
              <article key={item.title} className="rounded-lg border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-950">{language === "hi" ? item.titleHi : item.title}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{language === "hi" ? item.textHi : item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="text-xl font-semibold text-zinc-950">
            {language === "hi" ? "Competitor quote signals" : "Competitor quote signals"}
          </h3>
          <div className="mt-4 divide-y divide-zinc-200">
            {competitorRows.map((row) => (
              <article key={row.name} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">{row.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{row.signal}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-zinc-950">{row.lastQuote}</p>
                    <p className="text-zinc-500">{row.winRate} win</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AlertsView({ language }: { language: Language }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-amber-700" />
          <h2 className="text-2xl font-semibold text-zinc-950">
            {language === "hi" ? "Smart alerts" : "Smart alerts"}
          </h2>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {language === "hi"
            ? "Due date, BG, EMD aur team reminders ek jagah."
            : "Due date, BG, EMD, and team reminders in one place."}
        </p>
      </div>
      <div className="divide-y divide-zinc-200">
        {alerts.map((alert) => (
          <article key={alert.title} className="grid gap-3 p-5 md:grid-cols-[1fr_120px] md:items-center">
            <div>
              <p className="font-semibold text-zinc-950">{alert.title}</p>
              <p className="mt-1 text-sm text-zinc-600">{alert.text}</p>
            </div>
            <span className={`w-fit rounded-md border px-3 py-1 text-sm font-semibold ${getStatusTone(alert.level)}`}>
              {alert.level}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function TeamView({ language }: { language: Language }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex items-center gap-2">
          <UsersRound className="h-6 w-6 text-blue-700" />
          <h2 className="text-2xl font-semibold text-zinc-950">
            {language === "hi" ? "Team work board" : "Team work board"}
          </h2>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {language === "hi"
            ? "Owner, accounts, technical aur tender desk ka kaam visible rahega."
            : "Owner, accounts, technical, and tender desk work stays visible."}
        </p>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        {teamTasks.map((task) => (
          <article key={task.task} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-500">{task.owner}</p>
                <p className="mt-1 font-semibold text-zinc-950">{task.task}</p>
              </div>
              <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${getStatusTone(task.status)}`}>
                {task.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricTile({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-600">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
    </article>
  );
}

function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
}: {
  rows: T[];
  columns: Array<{ key: keyof T; label: string }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[2200px] divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-100">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-3 py-3 font-semibold text-zinc-700">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-zinc-50">
              {columns.map((column) => (
                <td key={String(column.key)} className="max-w-[260px] px-3 py-3 align-top text-zinc-700">
                  {column.key === "folderLink" ||
                  column.key === "tenderLink" ||
                  column.key === "contractNo" ||
                  column.key === "bgNumber" ||
                  column.key === "cracLink" ? (
                    <a href={String(row[column.key])} className="font-semibold text-blue-700 underline underline-offset-4">
                      {String(row[column.key])}
                    </a>
                  ) : column.key === "currentStatus" || column.key === "orderStatus" ? (
                    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getStatusTone(String(row[column.key]))}`}>
                      {String(row[column.key])}
                    </span>
                  ) : (
                    <span className="break-words">{String(row[column.key])}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FolderGrid({
  language,
  customer,
  tenders,
}: {
  language: Language;
  customer: CustomerProfile;
  tenders: TenderRow[];
}) {
  const t = c(language);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-amber-700" />
          <h2 className="text-2xl font-semibold text-zinc-950">{t.folders}</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {t.folderBase}: /folders/{customer.customerId}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tenders.map((tender) => (
          <article key={tender.tenderNumber} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <FolderOpen className="h-6 w-6 shrink-0 text-amber-700" />
              <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${getStatusTone(tender.currentStatus)}`}>
                {tender.currentStatus}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-950">{tender.tenderTitle}</h3>
            <p className="mt-2 font-mono text-xs text-zinc-500">{tender.tenderNumber}</p>
            <a href={tender.folderLink} className="mt-4 inline-flex min-h-10 items-center gap-2 break-all rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <FolderOpen className="h-4 w-4 shrink-0" />
              {tender.folderLink}
            </a>
            <div className="mt-4 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">
              {t.files}: Tender PDF, EMD proof, BOQ, submitted bid, clarifications
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CustomerPortal() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted && data.user) {
        setCustomer(profileFromSupabaseUser(data.user));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCustomer(session?.user ? profileFromSupabaseUser(session.user) : null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function toggleLanguage() {
    setLanguage((current) => (current === "en" ? "hi" : "en"));
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <>
      {customer ? (
        <Dashboard
          customer={customer}
          language={language}
          theme={theme}
          onLanguageToggle={toggleLanguage}
          onThemeToggle={toggleTheme}
          onLogout={() => {
            void supabase.auth.signOut();
            setCustomer(null);
          }}
        />
      ) : (
        <PublicHome
          language={language}
          theme={theme}
          onLanguageToggle={toggleLanguage}
          onThemeToggle={toggleTheme}
          onAuthOpen={openAuth}
        />
      )}

      {authOpen ? (
        <AuthDrawer
          mode={authMode}
          language={language}
          theme={theme}
          onClose={() => setAuthOpen(false)}
          onModeChange={setAuthMode}
          onSubmit={(profile) => {
            setCustomer(profile);
            setAuthOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
