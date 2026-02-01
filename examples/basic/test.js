import { retry } from "jitterbug";

let count = 0;

const fn = retry(async () => {
  if (count++ < 2) throw new Error("fail");
  return "ok";
}, {
  maxAttempts: 5,
  delay: 10
});

const result = await fn();

if (result !== "ok") {
  console.error("Integration test failed");
  process.exit(1);
}

console.log("Integration test passed");
