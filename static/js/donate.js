document.addEventListener("DOMContentLoaded", () => {
  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const phoneViewport = window.matchMedia(
    "(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)"
  );
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-node-sync]").forEach((terminal) => {
    const command = terminal.querySelector("[data-terminal-command]");
    if (!command) return;

    const commands = [
      { network: "bitcoin", command: "bitcoin-cli getblockchaininfo" },
      { network: "monero", command: "monerod sync_info" },
    ];
    const waitUntilVisible = () => {
      if (!document.hidden) return Promise.resolve();
      return new Promise((resolve) => {
        const resume = () => {
          if (document.hidden) return;
          document.removeEventListener("visibilitychange", resume);
          resolve();
        };
        document.addEventListener("visibilitychange", resume);
      });
    };
    const pause = async (milliseconds) => {
      await waitUntilVisible();
      await wait(milliseconds);
      await waitUntilVisible();
    };
    const updateVisibility = () => terminal.classList.toggle("is-paused", document.hidden);

    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    if (phoneViewport.matches || reduceMotion) {
      command.textContent = "";
      terminal.classList.add("is-complete");
      return;
    }

    const typeCommand = async (value) => {
      command.textContent = "";
      for (const character of value) {
        command.textContent += character;
        await pause(42);
      }
    };

    const runNodeSync = async () => {
      await pause(900);

      for (const item of commands) {
        terminal.dataset.nodeNetwork = item.network;
        await typeCommand(item.command);
        await pause(1350);
        terminal.classList.add("is-switching");
        await pause(180);
        command.textContent = "";
        terminal.classList.remove("is-switching");
        await pause(420);
      }

      terminal.classList.add("is-complete");
    };

    runNodeSync();
  });

  document.querySelectorAll("[data-copy-address]").forEach((button) => {
    const label = button.querySelector("span");
    if (!label) return;

    const originalLabel = label.textContent;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.address);
        button.classList.add("is-copied");
        label.textContent = "Copied";
      } catch {
        label.textContent = "Copy Failed";
      }

      window.setTimeout(() => {
        button.classList.remove("is-copied");
        label.textContent = originalLabel;
      }, 1800);
    });
  });
});
