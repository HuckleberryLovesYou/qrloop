import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  FileText,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
  MapPin,
  BadgeCent,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { parseQRCodeText, formatDateToICal } from "../utils/qrParser";
import type {
  WifiData,
  EmailData,
  WhatsAppData,
  SMSData,
  VCardData,
  CalendarData,
  GeoData,
  CryptoData,
  PresetType,
} from "../utils/qrParser";

export type { PresetType } from "../utils/qrParser";

interface PresetFormsProps {
  activePreset: PresetType;
  setActivePreset: (type: PresetType) => void;
  onTextChange: (formattedText: string) => void;
  initialValue?: string; // Loaded from URL code
}

export default function PresetForms({
  activePreset,
  setActivePreset,
  onTextChange,
  initialValue,
}: PresetFormsProps) {
  const parsedInitial = initialValue ? parseQRCodeText(initialValue) : null;

  // Define states for each form input
  const [url, setUrl] = useState(() =>
    parsedInitial?.type === "url" ? parsedInitial.data.url : "",
  );
  const [text, setText] = useState(() =>
    parsedInitial?.type === "text" ? parsedInitial.data.text : "",
  );
  const [wifi, setWifi] = useState<WifiData>(() =>
    parsedInitial?.type === "wifi"
      ? parsedInitial.data
      : { ssid: "", password: "", encryption: "WPA", hidden: false },
  );
  const [email, setEmail] = useState<EmailData>(() =>
    parsedInitial?.type === "email"
      ? parsedInitial.data
      : { to: "", subject: "", body: "" },
  );
  const [whatsapp, setWhatsapp] = useState<WhatsAppData>(() =>
    parsedInitial?.type === "whatsapp"
      ? parsedInitial.data
      : { phone: "", message: "" },
  );
  const [sms, setSms] = useState<SMSData>(() =>
    parsedInitial?.type === "sms"
      ? parsedInitial.data
      : { phone: "", message: "" },
  );
  const [phone, setPhone] = useState(() =>
    parsedInitial?.type === "phone" ? parsedInitial.data.phone : "",
  );
  const [vcard, setVcard] = useState<VCardData>(() =>
    parsedInitial?.type === "vcard"
      ? parsedInitial.data
      : {
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          company: "",
          title: "",
          address: "",
          website: "",
        },
  );
  const [calendar, setCalendar] = useState<CalendarData>(() =>
    parsedInitial?.type === "calendar"
      ? parsedInitial.data
      : {
          title: "",
          description: "",
          location: "",
          startDate: "",
          endDate: "",
        },
  );
  const [geo, setGeo] = useState<GeoData>(() =>
    parsedInitial?.type === "geo"
      ? parsedInitial.data
      : { latitude: "", longitude: "" },
  );
  const [crypto, setCrypto] = useState<CryptoData>(() =>
    parsedInitial?.type === "crypto"
      ? parsedInitial.data
      : { currency: "bitcoin", address: "", amount: "", message: "" },
  );

  let formattedText = "";
  switch (activePreset) {
    case "url":
      formattedText = url.trim();
      break;
    case "text":
      formattedText = text;
      break;
    case "wifi":
      formattedText = `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};H:${wifi.hidden ? "true" : ""};;`;
      break;
    case "email":
      formattedText = `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
      break;
    case "whatsapp": {
      const cleanPhone = whatsapp.phone.replace(/[^0-9]/g, "");
      formattedText = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsapp.message)}`;
      break;
    }
    case "sms":
      formattedText = `SMTO:${sms.phone}:${sms.message}`;
      break;
    case "phone":
      formattedText = `tel:${phone}`;
      break;
    case "vcard":
      formattedText = `BEGIN:VCARD
VERSION:3.0
N:${vcard.lastName};${vcard.firstName};;;
FN:${vcard.firstName} ${vcard.lastName}
ORG:${vcard.company}
TITLE:${vcard.title}
TEL:${vcard.phone}
EMAIL:${vcard.email}
ADR:;;${vcard.address};;;;
URL:${vcard.website}
END:VCARD`;
      break;
    case "calendar":
      formattedText = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${calendar.title}
DESCRIPTION:${calendar.description}
LOCATION:${calendar.location}
DTSTART:${formatDateToICal(calendar.startDate)}
DTEND:${formatDateToICal(calendar.endDate)}
END:VEVENT
END:VCALENDAR`;
      break;
    case "geo":
      formattedText = `geo:${geo.latitude},${geo.longitude}`;
      break;
    case "crypto": {
      const query = [];
      if (crypto.amount) query.push(`amount=${crypto.amount}`);
      if (crypto.message)
        query.push(`message=${encodeURIComponent(crypto.message)}`);
      formattedText = `${crypto.currency}:${crypto.address}${query.length > 0 ? "?" + query.join("&") : ""}`;
      break;
    }
  }

  useEffect(() => {
    onTextChange(formattedText);
  }, [formattedText, onTextChange]);

  const tabs: { type: PresetType; label: string; icon: React.ReactNode }[] = [
    { type: "url", label: "URL", icon: <Link className="w-4 h-4" /> },
    { type: "text", label: "Text", icon: <FileText className="w-4 h-4" /> },
    { type: "wifi", label: "WiFi", icon: <Wifi className="w-4 h-4" /> },
    { type: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
    {
      type: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle className="w-4 h-4" />,
    },
    { type: "sms", label: "SMS", icon: <MessageSquare className="w-4 h-4" /> },
    { type: "phone", label: "Phone", icon: <Phone className="w-4 h-4" /> },
    {
      type: "vcard",
      label: "Contact (vCard)",
      icon: <User className="w-4 h-4" />,
    },
    {
      type: "calendar",
      label: "Calendar",
      icon: <CalendarIcon className="w-4 h-4" />,
    },
    { type: "geo", label: "Location", icon: <MapPin className="w-4 h-4" /> },
    {
      type: "crypto",
      label: "Crypto",
      icon: <BadgeCent className="w-4 h-4" />,
    },
  ];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag state refs
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
  const hasDragged = useRef(false);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;

    // Check if we can scroll left (with a 2px tolerance for sub-pixel zoom rendering)
    setCanScrollLeft(container.scrollLeft > 2);

    // Check if we can scroll right
    const hasMoreRight =
      container.scrollLeft + container.clientWidth < container.scrollWidth - 2;
    setCanScrollRight(hasMoreRight);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollButtons();

    // Use ResizeObserver to detect width changes dynamically
    const resizeObserver = new ResizeObserver(() => {
      updateScrollButtons();
    });
    resizeObserver.observe(container);

    container.addEventListener("scroll", updateScrollButtons, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", updateScrollButtons);
    };
  }, []);

  const scrollByAmount = (amount: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Mouse drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollRef.current;
    if (!container) return;

    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
    scrollLeftVal.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const x = e.pageX;
    const walk = x - startX.current; // Drag speed 1:1 mapping

    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    container.scrollLeft = scrollLeftVal.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    setTimeout(() => {
      hasDragged.current = false;
    }, 50);
  };

  const handleContainerClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Scrollable Tabs Wrapper */}
      <div className="flex items-center w-full relative -mx-1 px-1">
        {/* Left Arrow Button */}
        <button
          type="button"
          id="scroll-presets-left"
          onClick={() => scrollByAmount(-180)}
          disabled={!canScrollLeft}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:text-neutral-600 disabled:border-neutral-900 disabled:bg-neutral-950/40 transition-all mr-2.5 mb-1 shadow-md active:scale-95 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleContainerClickCapture}
          className="preset-scrollbar flex items-center gap-1.5 overflow-x-auto pb-2 flex-1 select-none cursor-grab active:cursor-grabbing"
        >
          {tabs.map((tab) => (
            <button
              key={tab.type}
              id={`preset-tab-${tab.type}`}
              onClick={() => setActivePreset(tab.type)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                activePreset === tab.type
                  ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                  : "bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          id="scroll-presets-right"
          onClick={() => scrollByAmount(180)}
          disabled={!canScrollRight}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:text-neutral-600 disabled:border-neutral-900 disabled:bg-neutral-950/40 transition-all ml-2.5 mb-1 shadow-md active:scale-95 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Form Fields */}
      <div className="bg-neutral-900/20 border border-neutral-800/80 rounded-xl p-5 glow-pink">
        {activePreset === "url" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Website URL
            </label>
            <input
              type="url"
              id="input-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
            />
          </div>
        )}

        {activePreset === "text" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Plain Text
            </label>
            <textarea
              id="input-text"
              placeholder="Type or paste any custom text content..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans resize-y"
            />
          </div>
        )}

        {activePreset === "wifi" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Network SSID (Name)
              </label>
              <input
                type="text"
                id="wifi-ssid"
                placeholder="My WiFi Network"
                value={wifi.ssid}
                onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Security Type
              </label>
              <select
                id="wifi-encryption"
                value={wifi.encryption}
                onChange={(e) =>
                  setWifi({ ...wifi, encryption: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              >
                <option value="WPA">WPA/WPA2/WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open / Enhanced Open</option>
              </select>
            </div>

            {wifi.encryption !== "nopass" && (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  id="wifi-password"
                  placeholder="••••••••••••"
                  value={wifi.password}
                  onChange={(e) =>
                    setWifi({ ...wifi, password: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            )}

            <div className="flex items-center gap-2 col-span-2 mt-1">
              <input
                type="checkbox"
                id="wifi-hidden"
                checked={wifi.hidden}
                onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                className="rounded bg-neutral-900 border-neutral-800 text-pink-500 focus:ring-pink-500 w-4 h-4 cursor-pointer accent-pink-500"
              />
              <label
                htmlFor="wifi-hidden"
                className="text-sm text-neutral-300 select-none cursor-pointer"
              >
                Hidden Network
              </label>
            </div>
          </div>
        )}

        {activePreset === "email" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Recipient Email
              </label>
              <input
                type="email"
                id="email-to"
                placeholder="hello@example.com"
                value={email.to}
                onChange={(e) => setEmail({ ...email, to: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Subject Line
              </label>
              <input
                type="text"
                id="email-subject"
                placeholder="Inquiry or Hello"
                value={email.subject}
                onChange={(e) =>
                  setEmail({ ...email, subject: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Message Body
              </label>
              <textarea
                id="email-body"
                placeholder="Write your email body copy..."
                value={email.body}
                onChange={(e) => setEmail({ ...email, body: e.target.value })}
                rows={3}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>
          </div>
        )}

        {activePreset === "whatsapp" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Phone Number (include country code, no +)
              </label>
              <input
                type="tel"
                id="whatsapp-phone"
                placeholder="491701234567"
                value={whatsapp.phone}
                onChange={(e) =>
                  setWhatsapp({ ...whatsapp, phone: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Prefilled Message
              </label>
              <textarea
                id="whatsapp-message"
                placeholder="Hey, I'm reaching out about..."
                value={whatsapp.message}
                onChange={(e) =>
                  setWhatsapp({ ...whatsapp, message: e.target.value })
                }
                rows={3}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>
          </div>
        )}

        {activePreset === "sms" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Recipient Number
              </label>
              <input
                type="tel"
                id="sms-phone"
                placeholder="+14155552671"
                value={sms.phone}
                onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                SMS Message Body
              </label>
              <textarea
                id="sms-message"
                placeholder="Type the text message to load..."
                value={sms.message}
                onChange={(e) => setSms({ ...sms, message: e.target.value })}
                rows={3}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>
          </div>
        )}

        {activePreset === "phone" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone-number"
              placeholder="+14155552671"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>
        )}

        {activePreset === "vcard" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                id="vcard-firstname"
                placeholder="John"
                value={vcard.firstName}
                onChange={(e) =>
                  setVcard({ ...vcard, firstName: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                id="vcard-lastname"
                placeholder="Doe"
                value={vcard.lastName}
                onChange={(e) =>
                  setVcard({ ...vcard, lastName: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                id="vcard-phone"
                placeholder="+1 555-555-5555"
                value={vcard.phone}
                onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                id="vcard-email"
                placeholder="john.doe@email.com"
                value={vcard.email}
                onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Company
              </label>
              <input
                type="text"
                id="vcard-company"
                placeholder="Acme Corp"
                value={vcard.company}
                onChange={(e) =>
                  setVcard({ ...vcard, company: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Job Title
              </label>
              <input
                type="text"
                id="vcard-title"
                placeholder="Product Architect"
                value={vcard.title}
                onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Address
              </label>
              <input
                type="text"
                id="vcard-address"
                placeholder="123 Developer St, San Francisco, CA"
                value={vcard.address}
                onChange={(e) =>
                  setVcard({ ...vcard, address: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Website
              </label>
              <input
                type="url"
                id="vcard-website"
                placeholder="https://johndoe.dev"
                value={vcard.website}
                onChange={(e) =>
                  setVcard({ ...vcard, website: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        )}

        {activePreset === "calendar" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Event Title
              </label>
              <input
                type="text"
                id="calendar-title"
                placeholder="QRLoop Release Party"
                value={calendar.title}
                onChange={(e) =>
                  setCalendar({ ...calendar, title: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="calendar-start-date"
                  value={calendar.startDate}
                  onChange={(e) =>
                    setCalendar({ ...calendar, startDate: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="calendar-end-date"
                  value={calendar.endDate}
                  onChange={(e) =>
                    setCalendar({ ...calendar, endDate: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                id="calendar-location"
                placeholder="Discord Server or 123 Event Lane"
                value={calendar.location}
                onChange={(e) =>
                  setCalendar({ ...calendar, location: e.target.value })
                }
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                id="calendar-description"
                placeholder="Add agenda, links, or notes..."
                value={calendar.description}
                onChange={(e) =>
                  setCalendar({ ...calendar, description: e.target.value })
                }
                rows={2}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>
          </div>
        )}

        {activePreset === "geo" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="number"
                id="geo-latitude"
                step="0.000001"
                placeholder="37.774929"
                value={geo.latitude}
                onChange={(e) => setGeo({ ...geo, latitude: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="number"
                id="geo-longitude"
                step="0.000001"
                placeholder="-122.419416"
                value={geo.longitude}
                onChange={(e) => setGeo({ ...geo, longitude: e.target.value })}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
              />
            </div>
          </div>
        )}

        {activePreset === "crypto" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Coin/Network
                </label>
                <select
                  id="crypto-currency"
                  value={crypto.currency}
                  onChange={(e) =>
                    setCrypto({ ...crypto, currency: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="solana">Solana (SOL)</option>
                  <option value="doge">Dogecoin (DOGE)</option>
                  <option value="litecoin">Litecoin (LTC)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Receiver Address
                </label>
                <input
                  type="text"
                  id="crypto-address"
                  placeholder="Address or ENS / Solana domain"
                  value={crypto.address}
                  onChange={(e) =>
                    setCrypto({ ...crypto, address: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Amount (Optional)
                </label>
                <input
                  type="number"
                  id="crypto-amount"
                  step="0.00000001"
                  placeholder="0.005"
                  value={crypto.amount}
                  onChange={(e) =>
                    setCrypto({ ...crypto, amount: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500 font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  id="crypto-message"
                  placeholder="Payment description"
                  value={crypto.message}
                  onChange={(e) =>
                    setCrypto({ ...crypto, message: e.target.value })
                  }
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Divider and Capacity Footer */}
        {(() => {
          const maxCapacity = 1273;
          const payloadBytes = new TextEncoder().encode(formattedText).length;
          const percentage = Math.min(
            100,
            Math.round((payloadBytes / maxCapacity) * 100),
          );
          const circleColor =
            percentage > 90
              ? "text-rose-500 animate-pulse"
              : percentage > 70
                ? "text-amber-500"
                : "text-pink-500";

          return (
            <div className="border-t border-neutral-800/60 mt-5 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                {/* SVG Circle Progress */}
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 transform -rotate-90"
                    viewBox="0 0 32 32"
                  >
                    <circle
                      className="text-neutral-800"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="12"
                      cx="16"
                      cy="16"
                    />
                    <circle
                      className={`${circleColor} transition-all duration-300`}
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 12}
                      strokeDashoffset={
                        2 * Math.PI * 12 * (1 - percentage / 100)
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="12"
                      cx="16"
                      cy="16"
                    />
                  </svg>
                </div>
                <span className="font-bold text-neutral-300">
                  {percentage}% space used
                </span>
                <div className="relative group flex items-center">
                  <button
                    type="button"
                    id="space-usage-info-btn"
                    className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5 rounded-full cursor-help"
                    aria-label="Space usage info"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-neutral-950/95 backdrop-blur-md border border-neutral-800/80 text-neutral-300 text-xs p-3 rounded-lg shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 origin-bottom z-50">
                    <p className="font-sans leading-relaxed">
                      Some presets may already allocate a bit of space. The
                      amount depends on the preset type used.
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-950/95" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
