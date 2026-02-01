import { retry } from "jitterbug";

function logSuccess(name) {
  console.log(`${name} passed`);
}

async function testBasicRetry() {
  let count = 0;

  const fn = retry(async () => {
    if (count++ < 2) throw new Error("fail");
    return "ok";
  }, {
    maxAttempts: 5,
    delay: 10
  });

  const result = await fn();
  if (result !== "ok") throw new Error("basic retry failed");

  logSuccess("Basic retry");
}

async function testErrorPropagation() {
  const fn = retry(async () => {
    throw new Error("boom");
  }, {
    maxAttempts: 1,
    delay: 5
  });

  let threw = false;
  try {
    await fn();
  } catch {
    threw = true;
  }

  if (!threw) throw new Error("error propagation failed");

  logSuccess("Error propagation");
}

async function testOnRetryCallback() {
  let callbackCount = 0;

  const fn = retry(async () => {
    throw new Error("always fails");
  }, {
    maxAttempts: 3,
    delay: 5,
    onRetry: () => callbackCount++
  });

  try {
    await fn();
  } catch {
    if (callbackCount !== 2) {
      throw new Error(`onRetry callback count mismatch: expected 2, got ${callbackCount}`);
    }
    logSuccess("onRetry callback");
    return;
  }

  throw new Error("onRetry test should have thrown");
}

const jitterConfigs = [
  { type: "none" },
  { type: "equal" },
  { type: "full" },
  { type: "fixed", amount: 5 },
  { type: "random" },
  { type: "decorrelated", base: 10, cap: 100 }
];

async function testJitterConfig(jitterConfig) {
  let count = 0;

  const fn = retry(async () => {
    if (count++ < 1) throw new Error("fail");
    return "done";
  }, {
    maxAttempts: 3,
    delay: 10,
    jitterConfig
  });

  const result = await fn();
  if (result !== "done") {
    throw new Error(`jitter config failed: ${JSON.stringify(jitterConfig)}`);
  }

  logSuccess(`Jitter: ${jitterConfig.type}`);
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

(async () => {
  try {
    await testBasicRetry();
    await testErrorPropagation();
    await testOnRetryCallback();

    for (const cfg of jitterConfigs) {
      await testJitterConfig(cfg);
    }

    console.log("All integration tests passed");
  } catch (err) {
    console.error("Integration test failed:", err.message);
    process.exit(1);
  }
})();
