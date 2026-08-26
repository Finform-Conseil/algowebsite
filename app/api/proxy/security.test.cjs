/* eslint-env node */
process.env.API_TARGET_1 ||= "http://public.example.test";
require("../../../components/technical-analysis/store/__tests__/testTypeScriptLoader.cjs");

const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  isRequestOriginAllowed,
  isValidTargetUrl,
} = require("./security.ts");

const withNodeEnv = (value, callback) => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = value;
  try {
    callback();
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
};

test("origin policy preserves the production same-origin exception", () => {
  assert.equal(
    isRequestOriginAllowed(
      "https://app.example.test",
      "https://app.example.test",
      [],
    ),
    true,
  );
});

test("origin policy accepts allowlisted external origins and rejects others", () => {
  const allowlist = ["https://trusted.example.test"];
  assert.equal(
    isRequestOriginAllowed(
      "https://trusted.example.test",
      "https://app.example.test",
      allowlist,
    ),
    true,
  );
  assert.equal(
    isRequestOriginAllowed(
      "https://evil.example.test",
      "https://app.example.test",
      allowlist,
    ),
    false,
  );
  assert.equal(isRequestOriginAllowed(null, "https://app.example.test", allowlist), true);
});

test("target policy allows only http(s) schemes", () => {
  withNodeEnv("development", () => {
    assert.equal(isValidTargetUrl("https://api.example.test"), true);
    assert.equal(isValidTargetUrl("http://api.example.test"), true);
    assert.equal(isValidTargetUrl("ftp://api.example.test"), false);
  });
});

test("production permits configured public HTTP targets without hardcoded hosts", () => {
  withNodeEnv("production", () => {
    assert.equal(isValidTargetUrl("http://public.example.test"), true);
    assert.equal(isValidTargetUrl("http://other.example.test"), false);
    assert.equal(isValidTargetUrl("https://other.example.test"), true);
  });
});

test("production still blocks loopback and private IPv4 targets", () => {
  withNodeEnv("production", () => {
    assert.equal(isValidTargetUrl("https://127.0.0.1"), false);
    assert.equal(isValidTargetUrl("https://10.0.0.4"), false);
    assert.equal(isValidTargetUrl("https://192.168.1.2"), false);
    assert.equal(isValidTargetUrl("https://172.16.0.2"), false);
  });
});
