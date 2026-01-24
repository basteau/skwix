#!/usr/bin/env bun
import { chef } from "./chef.ts";

const [cmd, ...args] = process.argv.slice(2);

async function run() {
  switch (cmd) {
    case "mark":
      await chef.mark();
      console.log("✓");
      break;
    case "gather":
      const result = await chef.gather();
      console.log(JSON.stringify(result));
      break;
    case "notify":
      await chef.notify(args.join(" "));
      console.log("✓");
      break;
    case "collect":
      const collectResult = await chef.collect(args[0], args[1] || "lfg", parseInt(args[2]) || 180000);
      console.log(JSON.stringify(collectResult));
      break;
    case "question":
      const [q, optionsJson, recommended] = args;
      await chef.question(q, JSON.parse(optionsJson), parseInt(recommended) || 0);
      console.log("✓");
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }
}

run().catch(e => {
  console.error(e.message);
  process.exit(1);
});
