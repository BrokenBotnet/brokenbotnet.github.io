const phone = matchMedia("(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)");
let state = "idle";
let attempts = 0;
const load = async () => {
  if (state !== "idle" || attempts >= 3 || phone.matches || document.documentElement.dataset.background === "off") return;
  state = "loading";
  try {
    const moduleURL = new URL("__NETWORK_MODULE__", import.meta.url);
    if (attempts) moduleURL.searchParams.set("retry", String(attempts));
    attempts += 1;
    await import(moduleURL.href);
    state = "ready";
    phone.removeEventListener("change", load);
    window.removeEventListener("online", load);
    document.removeEventListener("brokenbotnet:background-change", load);
  } catch {
    state = "idle";
    document.documentElement.dataset.network = "unavailable";
  }
};
phone.addEventListener("change", load);
window.addEventListener("online", load);
document.addEventListener("brokenbotnet:background-change", load);
load();
