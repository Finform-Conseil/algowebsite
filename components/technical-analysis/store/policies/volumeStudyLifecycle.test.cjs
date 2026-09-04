/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../__tests__/testTypeScriptLoader.cjs");

const { resolveVolumeStudyLifecycle } = require("./volumeStudyLifecycle.ts");

const indicators = (patch = {}) => ({
  sma: false,
  ema: false,
  volume: true,
  volumeVisible: true,
  activeSma: [],
  activeEma: [],
  activeWma: [],
  activeDema: [],
  activeTema: [],
  activeHma: [],
  activeZlema: [],
  activeAlma: [],
  activeSmma: [],
  activeKama: [],
  activeVwma: [],
  ...patch,
});

const appearance = (showVolume = true) => ({ showVolume });

test("Volume lifecycle keeps attachment, study visibility and Style output orthogonal", () => {
  assert.deepEqual(
    resolveVolumeStudyLifecycle({ indicators: indicators(), appearance: appearance(true) }),
    { attached: true, studyVisible: true, outputEnabled: true, paneAttached: true, barsVisible: true },
  );

  assert.deepEqual(
    resolveVolumeStudyLifecycle({ indicators: indicators({ volumeVisible: false }), appearance: appearance(true) }),
    { attached: true, studyVisible: false, outputEnabled: true, paneAttached: true, barsVisible: false },
  );

  assert.deepEqual(
    resolveVolumeStudyLifecycle({ indicators: indicators(), appearance: appearance(false) }),
    { attached: true, studyVisible: true, outputEnabled: false, paneAttached: true, barsVisible: false },
  );

  assert.deepEqual(
    resolveVolumeStudyLifecycle({ indicators: indicators({ volume: false }), appearance: appearance(true) }),
    { attached: false, studyVisible: false, outputEnabled: true, paneAttached: false, barsVisible: false },
  );
});

test("legacy persisted snapshots without volumeVisible fail open to visible", () => {
  const legacy = indicators();
  delete legacy.volumeVisible;
  assert.equal(resolveVolumeStudyLifecycle({ indicators: legacy, appearance: appearance(true) }).studyVisible, true);
});
