/* eslint-env node */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_URL = "http://127.0.0.1:3000/equity/technical-analysis";
const DEFAULT_CDP_URL = "http://127.0.0.1:9222";
const DEFAULT_SCREENSHOT = path.join(os.tmpdir(), "ta-indicators-mcp-smoke.png");

const smokeUrl = process.env.TA_SMOKE_URL || DEFAULT_URL;
const cdpUrl = process.env.CDP_URL || DEFAULT_CDP_URL;
const screenshotPath = process.env.TA_SMOKE_SCREENSHOT || DEFAULT_SCREENSHOT;

const createTargetUrl = () => {
  if (process.env.TA_SMOKE_REUSE_PAGE === "1") return smokeUrl;
  const url = new URL(smokeUrl);
  url.searchParams.set("taSmokeRun", `${Date.now()}-${process.pid}`);
  return url.toString();
};

const targetUrl = createTargetUrl();

const activationLabels = [
  "VWAP",
  "Bollinger Bands",
  "RSI 14",
  "MACD Ligne",
  "Pivot Points Standard",
  "Volume Profile",
  "Doji",
  "Spinning Top",
  "Hammer",
  "Engulfing Bullish",
  "Engulfing Bearish",
];

const matrixSeriesRequirements = [
  { category: "overlay-line", ids: ["vwap-line"] },
  { category: "overlay-zone", ids: ["boll-fill", "boll-upper", "boll-mid", "boll-lower"] },
  { category: "bottom-panel-simple", ids: ["rsi-series"] },
  { category: "composite-multi-lines", ids: ["macd-line", "macd-signal"] },
  { category: "histogram", ids: ["macd-hist"] },
  {
    category: "pivot",
    ids: [
      "pivot-standard-p",
      "pivot-standard-r1",
      "pivot-standard-r2",
      "pivot-standard-r3",
      "pivot-standard-s1",
      "pivot-standard-s2",
      "pivot-standard-s3",
    ],
  },
  { category: "volume-profile", ids: ["volume-profile-rows", "vp-poc", "vp-vah", "vp-val"] },
];

const matrixAnySeriesRequirements = [
  {
    category: "chandelier-marker/bracket",
    ids: [
      "doji-marker",
      "spinning-top-marker",
      "hammer-marker",
      "engulfing-bullish-bracket",
      "engulfing-bearish-bracket",
    ],
  },
];

const expectedSeriesIds = [
  ...matrixSeriesRequirements.flatMap((requirement) => requirement.ids),
  ...matrixAnySeriesRequirements.flatMap((requirement) => requirement.ids),
];

const objectTreeLabels = [
  "VWAP",
  "Prix > VWAP",
  "Bollinger Bands",
  "BB Upper",
  "BB Middle",
  "BB Lower",
  "BB Background",
  "RSI",
  "MACD",
  "MACD Line",
  "MACD Signal",
  "MACD Histogram",
  "Pivot Points Standard",
  "Pivot",
  "R1",
  "R2",
  "R3",
  "S1",
  "S2",
  "S3",
  "Volume Profile",
  "Volume Profile Rows",
  "POC",
  "VAH",
  "VAL",
  "Doji",
  "Spinning Top",
  "Hammer",
  "Engulfing Bullish",
  "Engulfing Bearish",
];


const localMcpBinary = path.join(
  os.homedir(),
  ".nvm/versions/node/v20.20.0/bin/chrome-devtools-mcp",
);

const resolveMcpCommand = () => {
  if (process.env.CHROME_DEVTOOLS_MCP_BIN) {
    return { command: process.env.CHROME_DEVTOOLS_MCP_BIN, args: [] };
  }
  if (fs.existsSync(localMcpBinary)) {
    return { command: localMcpBinary, args: [] };
  }
  return { command: "chrome-devtools-mcp", args: [] };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createMcpClient = () => {
  const resolved = resolveMcpCommand();
  const proc = spawn(resolved.command, [
    ...resolved.args,
    `--browser-url=${cdpUrl}`,
    "--no-usage-statistics",
    "--no-performance-crux",
  ], { stdio: ["pipe", "pipe", "pipe"] });

  let nextId = 1;
  let buffer = "";
  const pending = new Map();

  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    let index = buffer.indexOf("\n");
    while (index >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      index = buffer.indexOf("\n");
      if (!line) continue;
      const message = JSON.parse(line);
      const waiter = pending.get(message.id);
      if (waiter) {
        clearTimeout(waiter.timer);
        pending.delete(message.id);
        waiter.resolve(message);
      }
    }
  });

  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    const important = text
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.includes("No handler registered for issue code PerformanceIssue"))
      .join("\n");
    if (important) process.stderr.write(`${important}\n`);
  });

  const request = (method, params = {}, timeoutMs = 20_000) => {
    const id = nextId;
    nextId += 1;
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`MCP timeout: ${method}`));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
    });
  };

  const notify = (method, params = {}) => {
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  };

  const close = () => {
    for (const waiter of pending.values()) clearTimeout(waiter.timer);
    pending.clear();
    proc.kill("SIGTERM");
  };

  return { request, notify, close };
};

const textOf = (response) => response.result?.content?.map((part) => part.text || "").join("\n") || "";

const parseToolJson = (response) => {
  const text = textOf(response);
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`MCP response did not contain JSON payload:\n${text.slice(0, 500)}`);
  return JSON.parse(match[1]);
};

const createToolCaller = (client) => async (name, args = {}, timeoutMs = 20_000) => {
  let response;
  try {
    response = await client.request("tools/call", { name, arguments: args }, timeoutMs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`MCP tool ${name} timed out or failed: ${message}`);
  }
  if (response.error) {
    throw new Error(`MCP tool ${name} failed: ${JSON.stringify(response.error)}`);
  }
  return response;
};

const evaluateJson = async (tool, functionSource, timeoutMs = 20_000) => {
  const response = await tool("evaluate_script", { function: functionSource }, timeoutMs);
  return parseToolJson(response);
};

const waitFor = async (label, callback, timeoutMs = 20_000, intervalMs = 750) => {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    try {
      lastValue = await callback();
      if (lastValue?.ok) return lastValue.value;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastValue = { ok: false, error: message };
    }
    await delay(intervalMs);
  }
  throw new Error(`${label} did not become ready. Last value: ${JSON.stringify(lastValue)}`);
};

const clickButtonByText = (needle) => `async () => {
  const getReactProps = (element) => {
    const key = Object.keys(element).find((item) => item.startsWith("__reactProps$"));
    return key ? element[key] : null;
  };
  const textOfButton = (button) => (button.innerText || button.textContent || "").replace(/\\s+/g, " ").trim();
  const button = Array.from(document.querySelectorAll('button, [role="button"]')).find((candidate) => textOfButton(candidate).includes(${JSON.stringify(needle)}));
  if (!button) return { ok: false, reason: "button not found", needle: ${JSON.stringify(needle)} };
  if (button.getAttribute("aria-pressed") === "true") return { ok: true, alreadyActive: true, needle: ${JSON.stringify(needle)} };
  button.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
  button.click();
  button.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, view: window }));
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (button.getAttribute("aria-pressed") === "true") return { ok: true, needle: ${JSON.stringify(needle)} };
  const props = getReactProps(button);
  if (typeof props?.onClick === "function") {
    props.onClick({ preventDefault() {}, stopPropagation() {}, currentTarget: button, target: button, nativeEvent: new MouseEvent("click", { bubbles: true }) });
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: button.getAttribute("aria-pressed") === "true", needle: ${JSON.stringify(needle)}, ariaPressed: button.getAttribute("aria-pressed") || "" };
}`;

const openIndicatorsModal = async (tool) => {
  await evaluateJson(tool, `async () => {
    if (document.body.innerText.includes("Indicateurs Techniques")) return { ok: true, alreadyOpen: true };
    const getReactProps = (element) => {
      const key = Object.keys(element).find((item) => item.startsWith("__reactProps$"));
      return key ? element[key] : null;
    };
    const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
      candidate.getAttribute("title") === "Indicateurs" || candidate.getAttribute("aria-label") === "Indicateurs"
    );
    if (!button) return { ok: false, reason: "indicator toolbar button not found" };
    button.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
    button.click();
    button.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, view: window }));
    await new Promise((resolve) => setTimeout(resolve, 900));
    if (document.body.innerText.includes("Indicateurs Techniques")) return { ok: true, openedByDomClick: true };
    const props = getReactProps(button);
    if (typeof props?.onClick === "function") {
      props.onClick({ preventDefault() {}, stopPropagation() {}, currentTarget: button, target: button, nativeEvent: new MouseEvent("click", { bubbles: true }) });
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ok: document.body.innerText.includes("Indicateurs Techniques") };
  }`, 25_000);

  await waitFor("Indicators modal", () => evaluateJson(tool, `() => ({
    ok: document.body.innerText.includes("Indicateurs Techniques") && document.body.innerText.includes("224 INDICATEURS DISPONIBLES"),
    value: true,
  })`, 10_000));
};

const readChartSeries = (tool) => evaluateJson(tool, `() => {
  const chart = document.querySelector("#gp-stock-chart");
  const fiberKey = chart && Object.keys(chart).find((key) => key.startsWith("__reactFiber$"));
  let fiber = fiberKey ? chart[fiberKey] : null;
  for (let depth = 0; fiber && depth < 80; depth += 1, fiber = fiber.return) {
    const props = fiber.memoizedProps || fiber.pendingProps || {};
    const ref = props.activeChartInstanceRef || props.chartInstanceRef;
    if (ref?.current && typeof ref.current.getOption === "function") {
      const option = ref.current.getOption();
      const series = Array.isArray(option.series) ? option.series : [];
      return {
        ok: true,
        value: series.map((entry) => ({
          id: entry.id || "",
          name: entry.name || "",
          type: entry.type || "",
          dataLength: Array.isArray(entry.data) ? entry.data.length : 0,
        })),
      };
    }
  }
  return { ok: false, reason: "chart instance ref not found" };
}`, 15_000);

const activateIndicators = async (tool) => {
  for (const label of activationLabels) {
    process.stdout.write(`Activating indicator: ${label}\n`);
    const result = await evaluateJson(tool, clickButtonByText(label), 45_000);
    if (!result.ok) throw new Error(`Unable to activate ${label}: ${JSON.stringify(result)}`);
    process.stdout.write(`Activated indicator: ${label}\n`);
  }
};

const buildMatrixProof = (series) => {
  const byId = new Map((series || []).map((entry) => [entry.id, entry]));
  const isRendered = (id) => byId.has(id) && byId.get(id).dataLength > 0;
  const required = matrixSeriesRequirements.map((requirement) => ({
    category: requirement.category,
    ids: requirement.ids,
    present: requirement.ids.filter(isRendered),
    missing: requirement.ids.filter((id) => !isRendered(id)),
  }));
  const any = matrixAnySeriesRequirements.map((requirement) => ({
    category: requirement.category,
    ids: requirement.ids,
    present: requirement.ids.filter(isRendered),
    missing: requirement.ids.filter((id) => !isRendered(id)),
  }));

  return {
    required,
    any,
    missingRequired: required.flatMap((requirement) => requirement.missing.map((id) => `${requirement.category}:${id}`)),
    missingAny: any
      .filter((requirement) => requirement.present.length === 0)
      .map((requirement) => `${requirement.category}: one of ${requirement.ids.join(", ")}`),
  };
};

const assertExpectedSeries = async (tool) => {
  const proof = await waitFor("expected indicator matrix series", async () => {
    const result = await readChartSeries(tool);
    const matrixProof = buildMatrixProof(result.value || []);
    return {
      ok: matrixProof.missingRequired.length === 0 && matrixProof.missingAny.length === 0,
      value: { series: result.value, matrixProof },
    };
  }, 35_000);
  return proof;
};

const verifyObjectTree = async (tool) => evaluateJson(tool, `async () => {
  const getReactProps = (element) => {
    const key = Object.keys(element).find((item) => item.startsWith("__reactProps$"));
    return key ? element[key] : null;
  };
  const clickControl = async (control) => {
    if (!control) return false;
    if (control.getAttribute("aria-pressed") === "true") return true;
    const props = getReactProps(control);
    if (typeof props?.onClick === "function") {
      props.onClick({ preventDefault() {}, stopPropagation() {}, currentTarget: control, target: control, nativeEvent: new MouseEvent("click", { bubbles: true }) });
    } else {
      control.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
      control.click();
      control.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, view: window }));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    return true;
  };

  if (document.body.innerText.includes("Indicateurs Techniques")) {
    const closeButton = Array.from(document.querySelectorAll("button")).find((button) =>
      /Fermer la modale|Fermer/i.test([button.getAttribute("aria-label") || "", button.getAttribute("title") || "", button.innerText || ""].join(" "))
    );
    await clickControl(closeButton);
  }

  const objectTreeButton = document.querySelector('[data-sidebar-entry="object-tree"]')
    || Array.from(document.querySelectorAll("button")).find((button) => /Objets et fenêtre de données|Object tree and data window/i.test([button.getAttribute("aria-label") || "", button.getAttribute("title") || "", button.innerText || ""].join(" ")));
  const opened = await clickControl(objectTreeButton);
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const bodyText = document.body.innerText.replace(/\\s+/g, " ");
  const expected = ${JSON.stringify(objectTreeLabels)};
  const missing = expected.filter((label) => !bodyText.includes(label));
  const rows = Array.from(document.querySelectorAll('[role="row"]')).map((row) => row.innerText.replace(/\\s+/g, " ").trim());
  return {
    ok: opened && missing.length === 0,
    opened,
    objectTreePressed: objectTreeButton?.getAttribute("aria-pressed") || "",
    missing,
    rows: rows.slice(0, 80),
    bodyExcerpt: bodyText.slice(0, 1200),
  };
}`, 20_000);

const assertNoConsoleErrors = async (tool) => {
  const response = await tool("list_console_messages", { types: ["error"], pageSize: 100 }, 15_000);
  const text = textOf(response);
  if (!text.includes("<no console messages found>")) {
    throw new Error(`Console errors detected:\n${text}`);
  }
};

const findPageId = (pagesText) => {
  const normalizedTarget = targetUrl.replace("localhost", "127.0.0.1");
  const line = pagesText
    .split(/\r?\n/)
    .find((entry) => {
      const normalizedEntry = entry.replace("localhost", "127.0.0.1");
      return normalizedEntry.includes(targetUrl) || normalizedEntry.includes(normalizedTarget);
    });
  const match = line?.match(/^\s*(\d+):/);
  return match ? Number(match[1]) : null;
};

const openPageViaCdp = async () => {
  const baseUrl = cdpUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/json/new?${encodeURIComponent(targetUrl)}`, { method: "PUT" });
  if (!response.ok) {
    throw new Error(`CDP could not open smoke page: ${response.status} ${response.statusText}`);
  }
};

const closeStaleSmokePages = async () => {
  const baseUrl = cdpUrl.replace(/\/$/, "");
  const response = await fetch(baseUrl + "/json/list");
  if (!response.ok) return;
  const targets = await response.json();
  const staleTargets = targets.filter((target) =>
    target.type === "page"
    && typeof target.url === "string"
    && target.url.includes("/equity/technical-analysis")
    && target.url.includes("taSmokeRun=")
  );
  for (const target of staleTargets) {
    await fetch(baseUrl + "/json/close/" + target.id).catch(() => null);
  }
};

const selectSmokePage = async (tool) => {
  if (process.env.TA_SMOKE_REUSE_PAGE !== "1") {
    await closeStaleSmokePages();
    await tool("new_page", { url: targetUrl, timeout: 90_000 }, 90_000);
    return;
  }

  let pages = await tool("list_pages", {}, 30_000);
  let pageId = findPageId(textOf(pages));

  if (pageId === null) {
    await openPageViaCdp();
    await delay(1_500);
    pages = await tool("list_pages", {}, 30_000);
    pageId = findPageId(textOf(pages));
  }

  if (pageId === null) {
    throw new Error("Unable to find the Technical Analysis smoke page in Chrome DevTools pages.");
  }

  await tool("select_page", { pageId, bringToFront: true }, 20_000);
};

(async () => {
  const client = createMcpClient();
  const tool = createToolCaller(client);
  try {
    await client.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "ta-indicators-mcp-smoke", version: "1.0.0" },
    }, 30_000);
    client.notify("notifications/initialized");

    await selectSmokePage(tool);
    await waitFor("Technical Analysis page", () => evaluateJson(tool, `() => ({
      ok: document.readyState === "complete" && Boolean(document.querySelector("#gp-stock-chart")),
      value: true,
    })`, 30_000), 90_000, 1_000);

    await openIndicatorsModal(tool);
    await activateIndicators(tool);
    const seriesProof = await assertExpectedSeries(tool);
    const objectTreeProof = await waitFor("Object Tree indicator rows", async () => {
      const result = await verifyObjectTree(tool);
      return { ok: result.ok, value: result };
    }, 25_000, 1_000);
    await assertNoConsoleErrors(tool);
    await tool("take_screenshot", { filePath: screenshotPath, format: "png" }, 30_000);

    console.log(JSON.stringify({
      status: "PASS",
      url: targetUrl,
      cdpUrl,
      screenshotPath,
      matrixProof: seriesProof.matrixProof,
      indicatorSeries: seriesProof.series.filter((entry) => expectedSeriesIds.includes(entry.id)),
      objectTree: objectTreeProof,
    }, null, 2));
  } finally {
    client.close();
  }
})().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
