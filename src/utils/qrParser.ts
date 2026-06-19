export type PresetType =
  | "url"
  | "text"
  | "wifi"
  | "email"
  | "whatsapp"
  | "sms"
  | "phone"
  | "vcard"
  | "calendar"
  | "geo"
  | "crypto";

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: string;
  hidden: boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface WhatsAppData {
  phone: string;
  message: string;
}

export interface SMSData {
  phone: string;
  message: string;
}

export interface PhoneData {
  phone: string;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  address: string;
  website: string;
}

export interface CalendarData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface GeoData {
  latitude: string;
  longitude: string;
}

export interface CryptoData {
  currency: string;
  address: string;
  amount: string;
  message: string;
}

export interface URLData {
  url: string;
}

export interface TextData {
  text: string;
}

export type ParsedQRPayload =
  | { type: "url"; data: URLData }
  | { type: "text"; data: TextData }
  | { type: "wifi"; data: WifiData }
  | { type: "email"; data: EmailData }
  | { type: "whatsapp"; data: WhatsAppData }
  | { type: "sms"; data: SMSData }
  | { type: "phone"; data: PhoneData }
  | { type: "vcard"; data: VCardData }
  | { type: "calendar"; data: CalendarData }
  | { type: "geo"; data: GeoData }
  | { type: "crypto"; data: CryptoData };

// Date to iCal (YYYYMMDDTHHMMSSZ)
export function formatDateToICal(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// iCal to Date (YYYY-MM-DDTHH:MM)
export function parseICalDate(icalStr: string): string {
  if (!icalStr) return "";
  const match = icalStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
  }
  return "";
}

// Auto-detect & parse preset payload
export function parseQRCodeText(text: string): ParsedQRPayload {
  const t = text.trim();

  // 1. Wifi
  if (t.startsWith("WIFI:")) {
    const ssidMatch = t.match(/S:([^;]+);/);
    const passMatch = t.match(/P:([^;]*);/);
    const typeMatch = t.match(/T:([^;]+);/);
    const hiddenMatch = t.match(/H:(true|false);/);
    let encryption = typeMatch ? typeMatch[1] : "WPA";
    if (encryption.toUpperCase() === "OWE") {
      encryption = "nopass";
    }
    return {
      type: "wifi",
      data: {
        ssid: ssidMatch ? ssidMatch[1] : "",
        password: passMatch ? passMatch[1] : "",
        encryption: encryption,
        hidden: hiddenMatch ? hiddenMatch[1] === "true" : false,
      },
    };
  }

  // 2. Email
  if (t.toLowerCase().startsWith("mailto:")) {
    const cleanMail = t.slice(7);
    const [to, query] = cleanMail.split("?");
    const params = new URLSearchParams(query || "");
    return {
      type: "email",
      data: {
        to: to || "",
        subject: params.get("subject") || "",
        body: params.get("body") || "",
      },
    };
  }

  // 3. Phone
  if (t.toLowerCase().startsWith("tel:")) {
    return {
      type: "phone",
      data: {
        phone: t.slice(4),
      },
    };
  }

  // 4. SMS
  if (
    t.toLowerCase().startsWith("smsto:") ||
    t.toLowerCase().startsWith("sms:")
  ) {
    const prefixLen = t.toLowerCase().startsWith("smsto:") ? 6 : 4;
    const content = t.slice(prefixLen);
    const colonIndex = content.indexOf(":");

    if (colonIndex !== -1) {
      return {
        type: "sms",
        data: {
          phone: content.slice(0, colonIndex),
          message: content.slice(colonIndex + 1),
        },
      };
    }

    const [phone, query] = content.split("?");
    const params = new URLSearchParams(query || "");
    return {
      type: "sms",
      data: {
        phone: phone || "",
        message: params.get("body") || "",
      },
    };
  }

  // 5. WhatsApp
  if (t.toLowerCase().includes("wa.me/")) {
    const parts = t.split("wa.me/");
    if (parts[1]) {
      const [phone, query] = parts[1].split("?");
      const params = new URLSearchParams(query || "");
      return {
        type: "whatsapp",
        data: {
          phone: phone || "",
          message: params.get("text") || "",
        },
      };
    }
  }

  // 6. Geolocation
  if (t.toLowerCase().startsWith("geo:")) {
    const coords = t.slice(4).split(",");
    return {
      type: "geo",
      data: {
        latitude: coords[0] || "",
        longitude: coords[1] || "",
      },
    };
  }

  // 7. Cryptocurrency
  const cryptoPrefixes = [
    "bitcoin:",
    "ethereum:",
    "solana:",
    "doge:",
    "litecoin:",
  ];
  const matchedCrypto = cryptoPrefixes.find((p) =>
    t.toLowerCase().startsWith(p),
  );
  if (matchedCrypto) {
    const currency = matchedCrypto.replace(":", "");
    const cleanCrypto = t.slice(matchedCrypto.length);
    const [address, query] = cleanCrypto.split("?");
    const params = new URLSearchParams(query || "");
    return {
      type: "crypto",
      data: {
        currency: currency,
        address: address || "",
        amount: params.get("amount") || "",
        message: params.get("message") || "",
      },
    };
  }

  // 8. vCard
  if (t.includes("BEGIN:VCARD")) {
    const lines = t.split(/\r?\n/);
    const data: VCardData = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      company: "",
      title: "",
      address: "",
      website: "",
    };
    lines.forEach((line) => {
      if (line.startsWith("FN:")) data.firstName = line.slice(3);
      if (line.startsWith("N:")) {
        const parts = line.slice(2).split(";");
        data.lastName = parts[0] || "";
        data.firstName = parts[1] || "";
      }
      if (line.startsWith("TEL:")) data.phone = line.slice(4);
      if (line.startsWith("EMAIL:")) data.email = line.slice(6);
      if (line.startsWith("ORG:")) data.company = line.slice(4);
      if (line.startsWith("TITLE:")) data.title = line.slice(6);
      if (line.startsWith("ADR:")) {
        const parts = line.slice(4).split(";");
        data.address = parts[2] || "";
      }
      if (line.startsWith("URL:")) data.website = line.slice(4);
    });
    return { type: "vcard", data };
  }

  // 9. Calendar
  if (t.includes("BEGIN:VEVENT")) {
    const lines = t.split(/\r?\n/);
    const data: CalendarData = {
      title: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
    };
    lines.forEach((line) => {
      if (line.startsWith("SUMMARY:")) data.title = line.slice(8);
      if (line.startsWith("DESCRIPTION:")) data.description = line.slice(12);
      if (line.startsWith("LOCATION:")) data.location = line.slice(9);
      if (line.startsWith("DTSTART:"))
        data.startDate = parseICalDate(line.slice(8));
      if (line.startsWith("DTEND:"))
        data.endDate = parseICalDate(line.slice(6));
    });
    return { type: "calendar", data };
  }

  // 10. URL
  if (
    t.toLowerCase().startsWith("http://") ||
    t.toLowerCase().startsWith("https://")
  ) {
    return {
      type: "url",
      data: { url: t },
    };
  }

  // Default: Plain Text
  return {
    type: "text",
    data: { text: t },
  };
}
