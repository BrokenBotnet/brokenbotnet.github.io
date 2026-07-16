(() => {
  const icons = {
    "arrow-right": [["path", { d: "M5 12h14" }], ["path", { d: "m12 5 7 7-7 7" }]],
    "arrow-up": [["path", { d: "m5 12 7-7 7 7" }], ["path", { d: "M12 19V5" }]],
    "arrow-up-right": [["path", { d: "M7 7h10v10" }], ["path", { d: "M7 17 17 7" }]],
    "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
    "code-2": [["path", { d: "m18 16 4-4-4-4" }], ["path", { d: "m6 8-4 4 4 4" }], ["path", { d: "m14.5 4-5 16" }]],
    container: [["path", { d: "M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" }], ["path", { d: "M10 21.9V14L2.1 9.1" }], ["path", { d: "m10 14 11.9-6.9" }], ["path", { d: "M14 19.8v-8.1" }], ["path", { d: "M18 17.5V9.4" }]],
    copy: [["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }], ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]],
    cpu: [["path", { d: "M12 20v2" }], ["path", { d: "M12 2v2" }], ["path", { d: "M17 20v2" }], ["path", { d: "M17 2v2" }], ["path", { d: "M2 12h2" }], ["path", { d: "M2 17h2" }], ["path", { d: "M2 7h2" }], ["path", { d: "M20 12h2" }], ["path", { d: "M20 17h2" }], ["path", { d: "M20 7h2" }], ["path", { d: "M7 20v2" }], ["path", { d: "M7 2v2" }], ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }], ["rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" }]],
    "external-link": [["path", { d: "M15 3h6v6" }], ["path", { d: "M10 14 21 3" }], ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]],
    network: [["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }], ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1" }], ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1" }], ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }], ["path", { d: "M12 12V8" }]],
    pin: [["path", { d: "M12 17v5" }], ["path", { d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" }]],
    rocket: [["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }], ["path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" }], ["path", { d: "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" }], ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" }]],
    rss: [["path", { d: "M4 11a9 9 0 0 1 9 9" }], ["path", { d: "M4 4a16 16 0 0 1 16 16" }], ["circle", { cx: "5", cy: "19", r: "1" }]],
    search: [["circle", { cx: "11", cy: "11", r: "8" }], ["path", { d: "m21 21-4.3-4.3" }]],
    server: [["rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2" }], ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2" }], ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6" }], ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18" }]],
    tag: [["path", { d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" }], ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }]],
    terminal: [["path", { d: "M12 19h8" }], ["path", { d: "m4 17 6-6-6-6" }]],
    x: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]]
  };
  const namespace = "http://www.w3.org/2000/svg";

  const createIcon = (placeholder, name, sharedAttributes) => {
    const icon = icons[name];
    if (!icon) return;

    const svg = document.createElementNS(namespace, "svg");
    const classNames = ["lucide", `lucide-${name}`, ...placeholder.classList];
    const attributes = {
      xmlns: namespace,
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      ...sharedAttributes
    };

    Object.entries(attributes).forEach(([attribute, value]) => svg.setAttribute(attribute, value));
    [...placeholder.attributes].forEach(({ name: attribute, value }) => {
      if (attribute !== "data-lucide" && attribute !== "class") svg.setAttribute(attribute, value);
    });
    svg.setAttribute("class", [...new Set(classNames)].join(" "));

    icon.forEach(([elementName, elementAttributes]) => {
      const element = document.createElementNS(namespace, elementName);
      Object.entries(elementAttributes).forEach(([attribute, value]) => element.setAttribute(attribute, value));
      svg.append(element);
    });

    placeholder.replaceWith(svg);
  };

  window.lucide = {
    createIcons({ attrs = {} } = {}) {
      document.querySelectorAll("[data-lucide]").forEach((placeholder) => {
        createIcon(placeholder, placeholder.dataset.lucide, attrs);
      });
    }
  };
})();
