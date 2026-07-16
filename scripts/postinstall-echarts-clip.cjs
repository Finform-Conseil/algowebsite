const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'echarts', 'lib', 'chart', 'candlestick', 'CandlestickView.js');

if (!fs.existsSync(target)) {
  console.warn('[postinstall-echarts-clip] CandlestickView.js not found, skipping patch');
  process.exit(0);
}

let src = fs.readFileSync(target, 'utf8');

const marker = '// Same real clip path as _renderLarge';
const dataAssignment = '    this._data = data;';
const renderNormalClose = dataAssignment + '\n  };';
const renderLargeStartNeedle = '\n  CandlestickView.prototype._renderLarge';
const patchCode = `
    // Same real clip path as _renderLarge - prevents wick overflow when
    // only part of the candle extends outside the grid (isNormalBoxClipped
    // only skips fully-outside candles, it doesn't clip partial overflow).
    var clipPath = seriesModel.get('clip', true) ? createClipPath(seriesModel.coordinateSystem, false, seriesModel) : null;
    if (clipPath) {
      this.group.setClipPath(clipPath);
    } else {
      this.group.removeClipPath();
    }
`;

if (src.includes(marker)) {
  const patchStart = src.indexOf('\n    ' + marker);
  const renderLargeStart = src.indexOf(renderLargeStartNeedle, patchStart);
  if (patchStart === -1 || renderLargeStart === -1) {
    console.warn('[postinstall-echarts-clip] Existing patch marker found, but cleanup bounds were not found');
    process.exit(1);
  }

  src = src.slice(0, patchStart) + '\n  };' + src.slice(renderLargeStart);
}

if (src.includes(marker)) {
  console.log('[postinstall-echarts-clip] Patch already applied, skipping');
  process.exit(0);
}

src = src.replace(/\r\n/g, '\n');

const idx = src.indexOf(renderNormalClose);
if (idx === -1) {
  console.warn('[postinstall-echarts-clip] Could not find insertion point in CandlestickView.js');
  process.exit(1);
}

src = src.slice(0, idx + dataAssignment.length) + patchCode + src.slice(idx + dataAssignment.length);
fs.writeFileSync(target, src, 'utf8');
console.log('[postinstall-echarts-clip] Patch applied to CandlestickView.js');
