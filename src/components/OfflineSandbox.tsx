import { useState, useEffect } from "react";
import { Shield, CheckCircle, Terminal } from "lucide-react";

export interface NetworkRequestLog {
  id: string;
  timestamp: string;
  type: "fetch" | "xhr";
  method: string;
  url: string;
  status: "allowed" | "blocked";
}

// Logger subscribers
type LogSubscriber = (log: NetworkRequestLog) => void;
const subscribers = new Set<LogSubscriber>();

let initialized = false;
const strictOfflineMode = true;

// Intercept network APIs (Fetch & XHR)
function initNetworkSandbox() {
  if (initialized) return;
  initialized = true;

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  const addLog = (type: "fetch" | "xhr", method: string, url: string) => {
    const newLog: NetworkRequestLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      method,
      url,
      status: strictOfflineMode ? "blocked" : "allowed",
    };
    subscribers.forEach((cb) => cb(newLog));
  };

  // Patch Fetch
  window.fetch = async function (input, init) {
    let url = "";
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === "object" && "url" in input) {
      url = (input as Request).url;
    }
    const method = init?.method || "GET";

    addLog("fetch", method, url);

    if (strictOfflineMode) {
      return Promise.reject(
        new TypeError(
          "Network request blocked: Strict Offline Sandboxing is active.",
        ),
      );
    }
    return originalFetch(input, init);
  };

  // Patch XHR
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _auditMethod?: string; _auditUrl?: string },
    method: string,
    url: string | URL,
    ...args: unknown[]
  ) {
    const urlStr = typeof url === "string" ? url : (url as URL).href;
    this._auditMethod = method;
    this._auditUrl = urlStr;
    return originalXHROpen.apply(this, [
      method,
      url,
      ...args,
    ] as unknown as Parameters<typeof originalXHROpen>);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _auditMethod?: string; _auditUrl?: string },
    body?: Document | XMLHttpRequestBodyInit | null,
  ) {
    const method = this._auditMethod || "GET";
    const url = this._auditUrl || "unknown";

    addLog("xhr", method, url);

    if (strictOfflineMode) {
      throw new Error(
        "Network request blocked: Strict Offline Sandboxing is active.",
      );
    }
    return originalXHRSend.call(this, body);
  };
}

export default function OfflineSandbox() {
  const [logs, setLogs] = useState<NetworkRequestLog[]>([]);

  useEffect(() => {
    initNetworkSandbox();

    const handleNewLog = (log: NetworkRequestLog) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    };

    subscribers.add(handleNewLog);

    return () => {
      subscribers.delete(handleNewLog);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-neutral-400" />
            Offline & Private
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Zero network requests are made. All QR code generation is done
            entirely on your device.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specs card */}
        <div className="lg:col-span-1 flex flex-col justify-between gap-4 bg-[#080808]/50 border border-neutral-800/80 p-4 rounded-lg">
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Local Security Specifications
            </h3>
            <ul className="text-sm text-neutral-300 space-y-2.5 mt-3 list-disc pl-4">
              <li>No external servers handle your data.</li>
              <li>QR codes are generated locally on your device.</li>
              <li>No tracking, analytics, or telemetry.</li>
              <li>Works completely offline.</li>
            </ul>
          </div>
        </div>

        {/* Console output */}
        <div className="lg:col-span-2 flex flex-col bg-black border border-neutral-900 rounded-lg overflow-hidden font-mono text-xs h-44">
          <div className="bg-neutral-950 border-b border-neutral-900 px-4 py-2 flex items-center justify-between">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              Network Interceptor Log
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 select-none">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400" />
                <span>Strict Sandbox is active</span>
              </div>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
            {logs.length === 0 ? (
              <div className="text-neutral-500 text-center py-8">
                <span className="text-emerald-500 font-bold">
                  ✓ 0 outbound requests performed.
                </span>
                <p className="mt-1 text-[11px] text-neutral-600">
                  Use the QR generator to validate offline isolation.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start justify-between border-b border-neutral-900 pb-1 ${
                    log.status === "blocked"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  <div className="truncate pr-4">
                    <span className="text-neutral-500">[{log.timestamp}]</span>{" "}
                    <span className="font-bold uppercase">[{log.type}]</span>{" "}
                    <span className="text-neutral-300 font-semibold">
                      {log.method}
                    </span>{" "}
                    <span className="underline select-all">{log.url}</span>
                  </div>
                  <div className="flex-shrink-0">
                    {log.status === "blocked" ? (
                      <span className="bg-rose-950/50 text-rose-400 px-1.5 py-0.5 rounded text-[10px] border border-rose-950">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="bg-amber-950/50 text-amber-400 px-1.5 py-0.5 rounded text-[10px] border border-amber-950">
                        MONITORED
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
