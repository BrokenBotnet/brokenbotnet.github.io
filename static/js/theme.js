(() => {
  const root = document.documentElement;
  const themeKey = "brokenbotnet:color-theme";
  const backgroundKey = "brokenbotnet:background";
  const themes = new Map([...document.querySelectorAll("meta[name='site-theme']")]
    .map((item) => [item.content, item.dataset]));
  const defaultTheme = root.dataset.defaultTheme || "brokenbotnet";
  const pickers = document.querySelectorAll("[data-theme-switcher]");
  const applyTheme = (value) => {
    const selected = themes.has(value) ? value : defaultTheme;
    const theme = themes.get(selected);
    root.dataset.theme = selected;
    pickers.forEach((picker) => {
      picker.querySelector("summary").setAttribute("aria-label", `Change color theme. Current theme: ${theme.label}`);
      picker.querySelectorAll("input[name='color-theme']").forEach((input) => {
        input.checked = input.value === selected;
      });
    });
    document.querySelector("meta[name='theme-color']").content = theme.color;
    document.querySelector("meta[name='color-scheme']").content = theme.scheme;
    document.dispatchEvent(new CustomEvent("brokenbotnet:theme-change"));
  };
  const applyBackground = (value) => {
    root.dataset.background = value === "off" ? "off" : "on";
    pickers.forEach((picker) => {
      const input = picker.querySelector("input[name='background-relays']");
      if (input) input.checked = root.dataset.background === "on";
    });
    document.dispatchEvent(new CustomEvent("brokenbotnet:background-change"));
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  };
  pickers.forEach((picker) => {
    picker.addEventListener("change", ({ target }) => {
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name === "color-theme" && themes.has(target.value)) {
        applyTheme(target.value);
        save(themeKey, target.value);
      } else if (target.name === "background-relays") {
        const value = target.checked ? "on" : "off";
        applyBackground(value);
        save(backgroundKey, value);
      }
    });
    picker.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      picker.open = false;
      picker.querySelector("summary").focus();
    });
  });
  document.addEventListener("click", (event) => {
    pickers.forEach((picker) => { if (!picker.contains(event.target)) picker.open = false; });
  });
  window.addEventListener("storage", (event) => {
    if (event.key === themeKey || event.key === null) applyTheme(event.newValue);
    if (event.key === backgroundKey || event.key === null) applyBackground(event.newValue);
  });
  window.addEventListener("pageshow", () => {
    let theme = root.dataset.theme;
    let background = root.dataset.background;
    try {
      theme = localStorage.getItem(themeKey);
      background = localStorage.getItem(backgroundKey);
    } catch {}
    applyTheme(theme);
    applyBackground(background);
  });
  applyTheme(root.dataset.theme);
  applyBackground(root.dataset.background);
})();
