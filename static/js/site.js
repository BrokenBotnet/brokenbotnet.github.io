document.addEventListener("DOMContentLoaded", () => {
  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const phoneViewport = window.matchMedia(
    "(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)"
  );
  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || phoneViewport.matches;

  document.querySelectorAll("[data-terminal-sequence]").forEach((terminal) => {
    const path = terminal.querySelector("[data-terminal-path]");
    const command = terminal.querySelector("[data-terminal-command]");
    if (!path || !command) return;

    const startPath = terminal.dataset.terminalStartPath || "~";
    const endPath = terminal.dataset.terminalEndPath || startPath;
    const cdCommand = terminal.dataset.terminalCdCommand || "";
    const finalCommand = terminal.dataset.terminalFinalCommand || "";
    const homeLink = terminal.dataset.terminalHomeLink || "/";
    const pathLink = terminal.dataset.terminalPathLink || "";
    const pathCurrent = terminal.dataset.terminalPathCurrent === "true";

    const setPath = (value, linkFinalPath = false) => {
      path.textContent = "";
      if (value.startsWith("~")) {
        const home = document.createElement("a");
        home.className = "prompt__home-link";
        home.href = homeLink;
        home.textContent = "~";
        home.setAttribute("aria-label", "Go to Home");
        home.title = "Home";
        if (terminal.classList.contains("terminal-prompt--home")) {
          home.setAttribute("aria-current", "page");
        }
        path.append(home);

        const remainder = value.slice(1);
        const isWritingPath = linkFinalPath && remainder === "/writing";
        if (!(isWritingPath && (pathLink || pathCurrent))) {
          path.append(document.createTextNode(remainder));
          return;
        }

        path.append(document.createTextNode("/"));
        if (pathCurrent && !pathLink) {
          const current = document.createElement("span");
          current.className = "prompt__cwd-current";
          current.textContent = "writing";
          current.setAttribute("aria-current", "page");
          path.append(current);
          return;
        }

        const link = document.createElement("a");
        link.className = "prompt__cwd-link";
        link.href = pathLink;
        link.textContent = "writing";
        link.setAttribute("aria-label", "Open Writing archive");
        if (pathCurrent) link.setAttribute("aria-current", "page");
        path.append(link);
        return;
      }

      path.textContent = value;
    };

    if (reduceMotion) {
      setPath(endPath, true);
      command.textContent = finalCommand;
      return;
    }

    const typeCommand = async (value) => {
      command.textContent = "";
      for (const character of value) {
        command.textContent += character;
        await wait(58);
      }
    };

    const runSequence = async () => {
      setPath(startPath);
      command.textContent = "";
      await wait(220);

      if (cdCommand) {
        await typeCommand(cdCommand);
        await wait(480);
        command.textContent = "";
        setPath(endPath, true);
        path.classList.add("is-updated");
        await wait(280);
      }

      if (finalCommand) await typeCommand(finalCommand);
    };

    runSequence();
  });

  const backToTop = document.querySelector("[data-back-to-top]");
  if (backToTop) {
    let updatePending = false;

    const updateBackToTop = () => {
      const revealAfter = Math.max(640, window.innerHeight * 0.8);
      backToTop.hidden = window.scrollY < revealAfter;
      updatePending = false;
    };

    window.addEventListener("scroll", () => {
      if (updatePending) return;
      updatePending = true;
      window.requestAnimationFrame(updateBackToTop);
    }, { passive: true });

    window.addEventListener("resize", updateBackToTop);
    backToTop.addEventListener("click", () => {
      const reduceScrollMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || phoneViewport.matches;
      window.scrollTo({ top: 0, behavior: reduceScrollMotion ? "auto" : "smooth" });
    });

    updateBackToTop();
  }

  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
        "stroke-width": "1.75"
      }
    });
  }
});
