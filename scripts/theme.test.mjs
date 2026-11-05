import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = (name) => readFileSync(new URL(`../static/js/${name}.js`, import.meta.url), "utf8");
const registry = JSON.parse(readFileSync(new URL("../data/themes.json", import.meta.url)));

function fixture({ stored = {}, blocked = false, defaultTheme = "brokenbotnet", backgroundAvailable = true } = {}) {
  const listeners = new Map();
  const register = (name, callback) => {
    if (!listeners.has(name)) listeners.set(name, []);
    listeners.get(name).push(callback);
  };
  const fire = (name, event = {}) => (listeners.get(name) || []).forEach((fn) => fn(event));
  const storage = new Map(Object.entries(stored));
  const root = { dataset: { defaultTheme }, classList: { add() {} } };
  const metas = registry.map(({ id, ...dataset }) => ({ content: id, dataset }));
  const color = {};
  const scheme = {};
  class Input { constructor(name, value) { Object.assign(this, { name, value, checked: false }); } }
  const inputs = registry.map(({ id }) => new Input("color-theme", id));
  const background = new Input("background-relays", "on");
  const label = {};
  const summary = { focus() { this.focused = true; }, setAttribute(name, value) { this[name] = value; } };
  const picker = {
    open: true,
    addEventListener: (name, fn) => register(`picker:${name}`, fn),
    contains: (target) => inputs.includes(target) || target === background,
    querySelectorAll: () => inputs,
    querySelector: (selector) => selector === "summary" ? summary : selector.includes("background-relays") ? (backgroundAvailable ? background : null) : label
  };
  const document = {
    documentElement: root,
    querySelectorAll: (selector) => selector.includes("site-theme") ? metas : [picker],
    querySelector: (selector) => selector.includes("theme-color") ? color : scheme,
    addEventListener: register,
    dispatchEvent: (event) => fire(event.type, event)
  };
  const localStorage = {
    getItem(key) { if (blocked) throw Error("blocked"); return storage.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw Error("blocked"); storage.set(key, value); }
  };
  const window = { localStorage, addEventListener: register };
  const context = vm.createContext({ document, window, localStorage, HTMLInputElement: Input,
    CustomEvent: class { constructor(type) { this.type = type; } } });
  const run = (name) => vm.runInContext(source(name), context);
  return { root, color, scheme, inputs, background, summary, picker, label, storage, fire, run };
}

test("theme-only pickers do not require a background control", () => {
  const f = fixture({ backgroundAvailable: false });
  f.run("boot"); f.run("theme");
  f.fire("picker:change", { target: f.inputs.find((input) => input.value === "daylight") });
  assert.equal(f.root.dataset.theme, "daylight");
  assert.equal(f.scheme.content, "light");
});

test("stored Daylight and disabled relays are applied before the page renders", () => {
  const f = fixture({ stored: { "brokenbotnet:color-theme": "daylight", "brokenbotnet:background": "off" } });
  f.run("boot"); f.run("theme");
  assert.equal(f.root.dataset.theme, "daylight");
  assert.equal(f.scheme.content, "light");
  assert.equal(f.color.content, "#f5f7fb");
  assert.equal(f.root.dataset.background, "off");
  assert.equal(f.background.checked, false);
  assert.equal(f.summary["aria-label"], "Change color theme. Current theme: Daylight");
});

test("unknown saved themes and cleared storage use the configured default", () => {
  const f = fixture({ stored: { "brokenbotnet:color-theme": "invalid" }, defaultTheme: "gruvbox-dark" });
  f.run("boot"); f.run("theme");
  assert.equal(f.root.dataset.theme, "gruvbox-dark");
  f.fire("storage", { key: "brokenbotnet:color-theme", newValue: "daylight" });
  assert.equal(f.scheme.content, "light");
  f.fire("storage", { key: null, newValue: null });
  assert.equal(f.root.dataset.theme, "gruvbox-dark");
  assert.equal(f.root.dataset.background, "on");
});

test("blocked storage still allows current-page appearance and background changes", () => {
  const f = fixture({ blocked: true });
  f.run("boot"); f.run("theme");
  const daylight = f.inputs.find((input) => input.value === "daylight");
  f.fire("picker:change", { target: daylight });
  f.background.checked = false;
  f.fire("picker:change", { target: f.background });
  f.fire("pageshow");
  assert.equal(f.root.dataset.theme, "daylight");
  assert.equal(f.root.dataset.background, "off");
});

test("preferences save independently; Escape and outside-click dismiss the chooser", () => {
  const f = fixture(); f.run("boot"); f.run("theme");
  f.fire("picker:change", { target: f.inputs[1] });
  assert.equal(f.storage.get("brokenbotnet:color-theme"), "gruvbox-dark");
  f.fire("picker:keydown", { key: "Escape" });
  assert.equal(f.picker.open, false);
  assert.equal(f.summary.focused, true);
  f.picker.open = true;
  f.fire("click", { target: f.background });
  assert.equal(f.picker.open, true);
  f.fire("click", { target: {} });
  assert.equal(f.picker.open, false);
});

test("module failures use a static fallback and bounded event-driven retries", async () => {
  const listeners = new Map();
  const root = { dataset: {} };
  const phone = { matches: true, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener() {} };
  const attempted = [];
  const context = vm.createContext({
    URL, String,
    matchMedia: () => phone,
    document: { documentElement: root, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener() {} },
    window: { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener() {} },
    loadModule: async (url) => { attempted.push(url); throw Error("network unavailable"); }
  });
  const loader = source("node-loader").replace("import.meta.url", '"https://preview.invalid/js/node-loader.js"')
    .replace("import(moduleURL.href)", "loadModule(moduleURL.href)");
  vm.runInContext(loader, context);
  assert.equal(attempted.length, 0);
  phone.matches = false;
  root.dataset.background = "off";
  await listeners.get("change")();
  assert.equal(attempted.length, 0);
  root.dataset.background = "on";
  await listeners.get("brokenbotnet:background-change")();
  assert.equal(root.dataset.network, "unavailable");
  await listeners.get("online")();
  await listeners.get("online")();
  await listeners.get("online")();
  assert.equal(attempted.length, 3);
  assert.equal(new Set(attempted).size, 3);
});

test("theme text, metadata and raised-surface links retain readable contrast", () => {
  const luminance = (hex) => {
    const channels = hex.match(/\w\w/g).map((channel) => parseInt(channel, 16) / 255)
      .map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return channels.reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  };
  for (const id of ["gruvbox-dark", "daylight"]) {
    const css = readFileSync(new URL(`../static/css/palettes/${id}.css`, import.meta.url), "utf8");
    const value = (name) => css.match(new RegExp(`--${name}:\\s*#([0-9a-f]{6})`))[1];
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (const [fg, bg] of [["base05", "base01"], ["base03", "base01"], ["base0D", "base02"], ["theme-small-muted", "base01"]]) {
      assert.ok(ratio(luminance(value(fg)), luminance(value(bg))) >= 4.5, `${id}: ${fg}/${bg}`);
    }
    assert.ok(ratio(luminance(value("theme-focus")), luminance(value("base01"))) >= 3, `${id}: focus`);
  }
});

test("renderer pauses for background-off, phone, hidden and reduced-motion states", () => {
  const events = new Map();
  const on = (name, fn) => {
    if (!events.has(name)) events.set(name, []);
    events.get(name).push(fn);
  };
  const fire = (name) => events.get(name)?.forEach((fn) => fn());
  const root = { dataset: {}, addEventListener: on, scrollHeight: 2000 };
  let pendingFrame = 0;
  let draws = 0;
  const phone = { matches: false, addEventListener: (name, fn) => on(`phone:${name}`, fn) };
  const reduced = { matches: false, addEventListener: (name, fn) => on(`reduced:${name}`, fn) };
  const gradient = { addColorStop() {} };
  const drawing = new Proxy({ clearRect() { draws++; }, createLinearGradient: () => gradient,
    createRadialGradient: () => gradient, getImageData: () => ({ data: [131, 165, 152, 255] }) },
  { get(target, key) { return target[key] ?? (() => {}); } });
  const canvas = { hidden: false, classList: { toggle() {}, remove() {} }, getContext: () => drawing,
    getBoundingClientRect: () => ({ width: 1200, height: 800 }) };
  const document = { documentElement: root, hidden: false, addEventListener: on,
    querySelector: (selector) => selector === "[data-relay-network]" ? canvas : null,
    querySelectorAll: () => [], createElement: () => canvas };
  const window = { innerWidth: 1200, innerHeight: 800, scrollY: 0, devicePixelRatio: 1,
    matchMedia: (query) => query.includes("reduced-motion") ? reduced : phone,
    addEventListener: on, sessionStorage: { getItem: () => "repeatable-layout" },
    requestAnimationFrame: () => { pendingFrame = 1; return 1; },
    cancelAnimationFrame: () => { pendingFrame = 0; } };
  const context = vm.createContext({ document, window, navigator: {},
    getComputedStyle: () => ({ getPropertyValue: () => "" }), CSS: { supports: () => true } });
  vm.runInContext(source("node-background"), context);
  assert.equal(pendingFrame, 1);
  root.dataset.background = "off"; fire("brokenbotnet:background-change");
  assert.equal(canvas.hidden, true);
  assert.equal(pendingFrame, 0);
  root.dataset.background = "on"; fire("brokenbotnet:background-change");
  assert.equal(canvas.hidden, false);
  assert.equal(pendingFrame, 1);
  phone.matches = true; fire("phone:change");
  assert.equal(canvas.hidden, true);
  assert.equal(pendingFrame, 0);
  phone.matches = false; fire("phone:change");
  assert.equal(pendingFrame, 1);
  reduced.matches = true; fire("reduced:change");
  assert.equal(pendingFrame, 0);
  assert.ok(draws > 0);
  reduced.matches = false; fire("reduced:change");
  document.hidden = true; fire("visibilitychange");
  assert.equal(pendingFrame, 0);
  document.hidden = false; fire("visibilitychange");
  assert.equal(pendingFrame, 1);
});

test("all themes preserve relay counts, positions, sizes and fading on load and switch", () => {
  const render = (initialTheme, width, height) => {
    const events = new Map();
    const on = (name, fn) => events.set(name, [...(events.get(name) || []), fn]);
    const root = { dataset: { theme: initialTheme }, scrollHeight: 2400, addEventListener: on };
    const palettes = new Map(registry.map(({ id }) => [id, readFileSync(
      new URL(`../static/css/palettes/${id}.css`, import.meta.url), "utf8"
    )]));
    let circles = [];
    let currentArc;
    const gradient = { addColorStop() {} };
    const drawing = new Proxy({
      clearRect() { circles = []; },
      arc(x, y, radius) { currentArc = { x, y, radius }; },
      fill() { if (currentArc.radius >= 1.5) circles.push({ ...currentArc, ink: this.fillStyle }); },
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
    }, { get: (target, key) => target[key] ?? (() => {}) });
    const colorDrawing = { clearRect() {}, fillRect() {}, getImageData() {
      return { data: root.dataset.theme === "brokenbotnet" ? [98, 214, 181, 255] : [184, 187, 38, 255] };
    } };
    const canvas = { classList: { toggle() {}, remove() {} }, getContext: () => drawing,
      getBoundingClientRect: () => ({ width, height }) };
    const panel = { getBoundingClientRect: () => ({ left: 120, right: width - 120,
      top: 160, bottom: 2200, width: width - 240, height: 2040 }) };
    const document = { documentElement: root, hidden: false, addEventListener: on,
      querySelector: (selector) => selector === "[data-relay-network]" ? canvas : null,
      querySelectorAll: () => [panel], createElement: () => ({ getContext: () => colorDrawing }) };
    const window = { innerWidth: width, innerHeight: height, scrollY: 0, devicePixelRatio: 1,
      matchMedia: (query) => ({ matches: query.includes("reduced-motion"), addEventListener() {} }),
      addEventListener: on, sessionStorage: { getItem: () => "theme-parity-regression" },
      requestAnimationFrame: () => 1, cancelAnimationFrame() {} };
    const context = vm.createContext({ document, window, navigator: {},
      getComputedStyle: () => ({ getPropertyValue: (name) =>
        palettes.get(root.dataset.theme).match(new RegExp(`${name}:\\s*([^;]+)`))?.[1] || "" }),
      CSS: { supports: () => true } });
    vm.runInContext(source("node-background"), context);
    return {
      snapshot: () => circles.map(({ ink, x, y, radius }) => ({
        x: Number(x.toFixed(6)), y: Number(y.toFixed(6)), radius,
        alpha: Number(Number(ink.match(/, ([\d.]+)\)$/)[1]).toFixed(6))
      })),
      colors: () => circles.map(({ ink }) => ink),
      select(id) { root.dataset.theme = id; events.get("brokenbotnet:theme-change").forEach((fn) => fn()); }
    };
  };
  for (const [width, height] of [[1280, 800], [1920, 1080]]) {
    const baseline = render("brokenbotnet", width, height);
    const expected = baseline.snapshot();
    assert.equal(expected.length, Math.min(132, Math.max(72, Math.round(width * height / 12500))));
    const originalColors = baseline.colors();
    for (const { id } of registry) {
      assert.deepEqual(render(id, width, height).snapshot(), expected, `${id}: initial layout`);
      baseline.select(id);
      assert.deepEqual(baseline.snapshot(), expected, `${id}: switched layout`);
    }
    baseline.select("gruvbox-dark");
    assert.notDeepEqual(baseline.colors(), originalColors, "theme colors must still change");
    baseline.select("brokenbotnet");
    assert.deepEqual(baseline.snapshot(), expected, "switching back must preserve layout");
  }
});
