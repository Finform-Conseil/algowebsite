const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../../..");
const source = fs.readFileSync(path.join(root, "components/technical-analysis/components/modals/date-picker/DatePickerModal.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles/pages/_technical-analysis-final.scss"), "utf8");

test("start and end summary cards are interactive endpoint controls", () => {
  assert.match(source, /type ActiveRangeEndpoint = keyof PendingRange/);
  assert.match(source, /const \[activeEndpoint, setActiveEndpoint\] = useState<ActiveRangeEndpoint>\("start"\)/);
  assert.match(source, /onClick=\{\(\) => focusEndpoint\("start"\)\}/);
  assert.match(source, /onClick=\{\(\) => focusEndpoint\("end"\)\}/);
  assert.match(source, /aria-pressed=\{activeEndpoint === "start"\}/);
  assert.match(source, /aria-pressed=\{activeEndpoint === "end"\}/);
});

test("endpoint focus navigates calendar to the selected endpoint month", () => {
  assert.match(source, /const targetDate = selection\[endpoint\]/);
  assert.match(source, /setCalendarMonth\(monthFromDateKey\(targetDate\)\)/);
});

test("selecting the start endpoint preserves a valid end and advances to end selection", () => {
  assert.match(source, /end: current\.end && current\.end >= dateKey \? current\.end : null/);
  assert.match(source, /if \(activeEndpoint === "start"\) setActiveEndpoint\("end"\)/);
});

test("active endpoint has explicit visual feedback", () => {
  assert.match(styles, /\.gp-date-range-endpoint\s*\{/);
  assert.match(styles, /&\.is-active\s*\{/);
  assert.match(styles, /var\(--gp-accent-gold/);
});

test("date picker stays compact and single-column on desktop", () => {
  assert.match(source, /maxWidth="560px"/);
  assert.match(source, /className="gp-date-range-endpoints"/);
  assert.match(source, /className="gp-date-range-navigation"/);
  assert.match(source, /className="gp-date-range-actions"/);
  assert.match(styles, /\.gp-date-range-modal\s*\{[\s\S]*?width:\s*min\(560px, calc\(100vw - 24px\)\)/);
  assert.match(styles, /\.gp-date-range-modal\s*\{[\s\S]*?\.gp-datepicker-container\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(styles, /\.gp-date-range-actions\s*\{[\s\S]*?justify-content:\s*flex-end/);
  assert.doesNotMatch(source, /maxWidth="760px"/);
});

test("calendar is flat and selected range reads as a continuous band", () => {
  assert.match(styles, /\.gp-date-range-modal\s*\{[\s\S]*?\.gp-calendar-grid\s*\{[\s\S]*?gap:\s*0;[\s\S]*?border:\s*0;/);
  assert.match(styles, /\.gp-calendar-day\s*\{[\s\S]*?background:\s*transparent;[\s\S]*?border-radius:\s*0;/);
  assert.match(styles, /&\.in-range\s*\{[\s\S]*?border-radius:\s*0;/);
  assert.match(styles, /&\.active\s*\{[\s\S]*?border-color:\s*color-mix/);
  assert.doesNotMatch(styles, /\.gp-date-range-modal[\s\S]*?\.gp-calendar-day\s*\{[\s\S]*?min-height:\s*3[6-9]px/);
});
