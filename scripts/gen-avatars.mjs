// Draws illustrated portraits for the simulated classmates (learner-1 … learner-17), in the same
// style as public/avatars/maya.svg. Deterministic: the same index always gives the same picture.
// Usage: node scripts/gen-avatars.mjs
import { writeFileSync } from "node:fs";

const skins = [
  ["#f1c7a5", "#d9a17e"], ["#e0a77c", "#c98b62"], ["#c68a5e", "#a8704b"], ["#a8704b", "#8a5838"],
  ["#8d5a3b", "#734628"], ["#f3d2b8", "#e2b190"], ["#d9a07a", "#bd8459"], ["#6f4630", "#5a3622"],
];
const hairs = ["#2b2220", "#4a3426", "#6b4423", "#a3683a", "#1c1716", "#c99a5b", "#3b2418", "#7a4b2a"];
const shirts = ["#2f6b55", "#e8885c", "#4f6d8f", "#c2554d", "#7a6aa6", "#d4a23c", "#3e8a8a", "#8a5a7a", "#5a7d3a"];
const backgrounds = ["#dbe8cf", "#f5e4d6", "#e5e1f0", "#dfeaf1", "#f4eac5", "#f2e3df"];

// Hair drawn behind the face (back) and over it (front).
const styles = [
  { name: "buns", back: (h) => `<circle cx="21" cy="40" r="10" fill="${h}"/><circle cx="75" cy="40" r="10" fill="${h}"/>`, front: (h) => `<path d="M27 42c0-17 9-25 21-25s21 8 21 25c-5-9-12-12-21-12s-16 3-21 12z" fill="${h}"/>` },
  { name: "short", back: () => "", front: (h) => `<path d="M28 40c0-14 8-21 20-21s20 7 20 21c-4-7-10-10-20-10s-16 3-20 10z" fill="${h}"/>` },
  { name: "long", back: (h) => `<path d="M26 46c0-19 9-28 22-28s22 9 22 28c0 10-2 17-5 21H31c-3-4-5-11-5-21z" fill="${h}"/>`, front: (h) => `<path d="M30 40c2-12 9-17 18-17s16 5 18 17c-6-7-12-9-18-9s-12 2-18 9z" fill="${h}"/>` },
  { name: "curly", back: (h) => `<circle cx="48" cy="28" r="20" fill="${h}"/><circle cx="31" cy="36" r="10" fill="${h}"/><circle cx="65" cy="36" r="10" fill="${h}"/>`, front: (h) => `<path d="M30 38c3-10 10-14 18-14s15 4 18 14c-6-4-12-6-18-6s-12 2-18 6z" fill="${h}"/>` },
  { name: "ponytail", back: (h) => `<path d="M64 30c12 2 16 14 10 26-2-9-6-14-12-16z" fill="${h}"/>`, front: (h) => `<path d="M28 41c0-15 8-22 20-22s20 7 20 22c-6-8-12-11-20-11s-15 3-20 11z" fill="${h}"/>` },
  { name: "side-part", back: () => "", front: (h) => `<path d="M28 42c-1-15 7-24 21-24 12 0 20 8 19 22-8-2-15-6-19-12-4 7-11 11-21 14z" fill="${h}"/>` },
  { name: "braids", back: (h) => `<path d="M27 44v26a5 5 0 0 0 10 0V48zM59 48v22a5 5 0 0 0 10 0V44z" fill="${h}"/>`, front: (h) => `<path d="M27 42c0-17 9-25 21-25s21 8 21 25c-5-9-12-12-21-12s-16 3-21 12z" fill="${h}"/>` },
  { name: "buzz", back: () => "", front: (h) => `<path d="M30 38c1-11 8-16 18-16s17 5 18 16c-5-5-11-7-18-7s-13 2-18 7z" fill="${h}" opacity=".85"/>` },
];

function portrait(i) {
  const [skin, neck] = skins[(i * 5 + 1) % skins.length];
  const hair = hairs[(i * 3 + 2) % hairs.length];
  const shirt = shirts[(i * 7) % shirts.length];
  const bg = backgrounds[(i * 2 + 1) % backgrounds.length];
  const style = styles[(i * 3) % styles.length];
  const glasses = i % 5 === 2;
  const smile = i % 3 === 0 ? "M41 55c4 4.5 10 4.5 14 0" : "M42 55c3.5 3.5 8.5 3.5 12 0";
  const eyes = glasses
    ? `<g fill="none" stroke="#2f2a28" stroke-width="2"><circle cx="40" cy="46" r="5.5"/><circle cx="56" cy="46" r="5.5"/><path d="M45.5 46h5"/></g><circle cx="40" cy="46" r="1.8" fill="#2f2a28"/><circle cx="56" cy="46" r="1.8" fill="#2f2a28"/>`
    : `<circle cx="40" cy="46" r="2.4" fill="#2b2220"/><circle cx="56" cy="46" r="2.4" fill="#2b2220"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Illustrated portrait">
  <circle cx="48" cy="48" r="48" fill="${bg}"/>
  ${style.back(hair)}
  <path d="M18 96c2-20 14-30 30-30s28 10 30 30z" fill="${shirt}"/>
  <path d="M41 58h14v12a7 7 0 0 1-14 0z" fill="${neck}"/>
  <ellipse cx="48" cy="44" rx="20" ry="22" fill="${skin}"/>
  ${style.front(hair)}
  ${eyes}
  <circle cx="35" cy="53" r="3.2" fill="#ef9f86" opacity=".5"/><circle cx="61" cy="53" r="3.2" fill="#ef9f86" opacity=".5"/>
  <path d="${smile}" fill="none" stroke="#7a3f2c" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;
}

for (let i = 1; i <= 17; i++) writeFileSync(new URL(`../public/avatars/learner-${i}.svg`, import.meta.url), portrait(i));
console.log("Wrote 17 portraits to public/avatars/");
