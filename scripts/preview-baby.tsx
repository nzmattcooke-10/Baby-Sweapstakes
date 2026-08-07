/**
 * Renders the baby across the extremes of both sliders to a static HTML file,
 * so the morph can actually be looked at rather than assumed correct.
 *
 *   npx tsx scripts/preview-baby.tsx <output.html>
 */
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { BabySvg } from "../src/components/baby/BabySvg";
import {
  LENGTH_MAX_MM,
  LENGTH_MIN_MM,
  WEIGHT_MAX_G,
  WEIGHT_MIN_G,
} from "../src/components/baby/morph";

const weights = [WEIGHT_MIN_G, 2500, 3400, 4200, 5200, WEIGHT_MAX_G];
const lengths = [LENGTH_MIN_MM, 450, 500, 550, LENGTH_MAX_MM];

const cells: string[] = [];

for (const lengthMm of lengths) {
  for (const weightGrams of weights) {
    const svg = renderToStaticMarkup(
      <BabySvg weightGrams={weightGrams} lengthMm={lengthMm} width={110} />,
    );
    cells.push(
      `<figure><div class="b">${svg}</div><figcaption>${(weightGrams / 1000).toFixed(1)}kg · ${(lengthMm / 10).toFixed(0)}cm</figcaption></figure>`,
    );
  }
}

const extras = [
  { label: "bonnet", props: { headwear: "bonnet" as const } },
  { label: "cap", props: { headwear: "cap" as const } },
  { label: "waving", props: { armPose: "wave" as const } },
  { label: "wave + bonnet", props: { headwear: "bonnet" as const, armPose: "wave" as const } },
].map(({ label, props }) => {
  const svg = renderToStaticMarkup(
    <BabySvg weightGrams={3400} lengthMm={500} width={110} {...props} />,
  );
  return `<figure><div class="b">${svg}</div><figcaption>${label}</figcaption></figure>`;
});

// Rotated a quarter turn, exactly as the length toy will present it.
const lying = [LENGTH_MIN_MM, 500, LENGTH_MAX_MM].map((lengthMm) => {
  const svg = renderToStaticMarkup(
    <BabySvg weightGrams={3400} lengthMm={lengthMm} width={110} />,
  );
  return `<figure><div class="b rot">${svg}</div><figcaption>lying · ${(lengthMm / 10).toFixed(0)}cm</figcaption></figure>`;
});

const html = `<!doctype html><meta charset="utf-8">
<title>Baby morph check</title>
<style>
  body { font: 14px system-ui; background: #FAF6F0; color: #3A2E26; padding: 24px; }
  h2 { margin: 28px 0 8px; font-size: 15px; }
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
  .row { display: flex; gap: 4px; flex-wrap: wrap; }
  figure { margin: 0; text-align: center; background: #fff; border-radius: 12px; padding: 6px; }
  figcaption { font-size: 11px; opacity: .7; }
  .b { display: flex; justify-content: center; align-items: flex-end; height: 130px; }
  .rot { transform: rotate(-90deg); }
</style>
<h2>weight across &times; length down &mdash; head must stay the same size in every cell</h2>
<div class="grid">${cells.join("")}</div>
<h2>headwear and pose</h2>
<div class="row">${extras.join("")}</div>
<h2>rotated for the length toy</h2>
<div class="row">${lying.join("")}</div>
`;

const out = process.argv[2] ?? "baby-preview.html";
writeFileSync(out, html);
console.log(`wrote ${out}`);
