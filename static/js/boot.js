document.documentElement.classList.add("js");
(() => {
  const root = document.documentElement;
  const themes = [...document.querySelectorAll("meta[name='site-theme']")];
  let selected = root.dataset.defaultTheme || "brokenbotnet";
  let background = "on";
  try {
    const stored = localStorage.getItem("brokenbotnet:color-theme");
    if (themes.some((theme) => theme.content === stored)) selected = stored;
    if (localStorage.getItem("brokenbotnet:background") === "off") background = "off";
  } catch {
  }
  root.dataset.theme = selected;
  root.dataset.background = background;
  const theme = themes.find((item) => item.content === selected);
  if (theme) {
    document.querySelector("meta[name='theme-color']").content = theme.dataset.color;
    document.querySelector("meta[name='color-scheme']").content = theme.dataset.scheme;
  }
})();
