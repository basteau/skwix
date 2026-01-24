#!/usr/bin/env bun
import { chef } from "./chef.ts";

interface SpecAnswers {
  projectName: string | null;
  techStack: number | null;
  authMethod: number | null;
  hostingPlatform: number | null;
  realtimeNeeds: boolean | null;
  designTheme: string | null;
  additionalNotes: { responses: string[]; stopped: boolean; timedOut: boolean };
}

async function runInterview(): Promise<SpecAnswers> {
  await chef.notify("🎬 Let's flesh out your skwix game spec!");

  const projectName = await chef.ask("📛 What's the project/game name? (e.g., 'Skwix', 'WinterWordle')");
  
  const techStack = await chef.choice("🛠️ Which tech stack for the frontend?", [
    "React + Vite + TailwindCSS",
    "Next.js + TailwindCSS", 
    "Laravel Inertia + React",
    "Laravel Blade + Alpine.js"
  ]);

  const authMethod = await chef.choice("🔐 How should players authenticate?", [
    "Magic link via email (invite-only)",
    "Simple invite code (no account)",
    "Email + password (classic)"
  ]);

  const hostingPlatform = await chef.choice("🚀 Deployment target?", [
    "Fly.io",
    "Vercel",
    "Self-hosted VPS",
    "Other"
  ]);

  const realtimeNeeds = await chef.confirm("⚡ Do you need real-time updates? (e.g., live leaderboard, instant win notification)");

  const designTheme = await chef.ask("🎨 Describe the winter theme vibe in 1-2 sentences (colors, mood, inspiration?)");

  await chef.notify("📝 Almost done! Any extra details about game mechanics?");
  
  const additionalNotes = await chef.collect("💭 Drop any additional notes about the game (type 'LFG' when done)", "lfg", 120000);

  return {
    projectName,
    techStack,
    authMethod,
    hostingPlatform,
    realtimeNeeds,
    designTheme,
    additionalNotes
  };
}

const answers = await runInterview();
console.log(JSON.stringify(answers, null, 2));

await chef.notify("✅ Got it all! Cooking up your spec now... 🍳");
