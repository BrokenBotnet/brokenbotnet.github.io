document.addEventListener("DOMContentLoaded", () => {
  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const scheduleFrame = typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame.bind(window)
    : (callback) => window.setTimeout(() => callback(Date.now()), 16);
  const phoneViewport = window.matchMedia(
    "(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)"
  );
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const retainCdCommand = terminal.dataset.terminalRetainCd === "true";
    const animateOnPhone = terminal.dataset.terminalMobileAnimate === "true";
    const skipCdOnPhone = terminal.dataset.terminalSkipCdOnPhone === "true";
    const skipCd = phoneViewport.matches && skipCdOnPhone;
    const finalDisplayCommand = retainCdCommand ? cdCommand : finalCommand;

    const setPath = (value, linkFinalPath = false) => {
      path.textContent = "";
      if (value.startsWith("~")) {
        const isHomeTerminal = terminal.classList.contains("terminal-prompt--home");
        if (isHomeTerminal) {
          const currentHome = document.createElement("span");
          currentHome.className = "prompt__home-current";
          currentHome.textContent = "~";
          currentHome.setAttribute("aria-current", "page");
          path.append(currentHome);
        } else {
          const home = document.createElement("a");
          home.className = "prompt__home-link";
          home.href = homeLink;
          home.textContent = "~";
          home.setAttribute("aria-label", "Go to Home");
          home.title = "Home";
          path.append(home);
        }

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

    if (prefersReducedMotion || (phoneViewport.matches && !animateOnPhone)) {
      setPath(endPath, true);
      command.textContent = finalDisplayCommand;
      terminal.classList.add("is-initialized");
      return;
    }

    setPath(skipCd ? endPath : startPath, skipCd);
    command.textContent = "";
    terminal.classList.add("is-initialized");

    const typeCommand = async (value) => {
      command.textContent = "";
      for (const character of value) {
        command.textContent += character;
        await wait(58);
      }
    };

    const runSequence = async () => {
      await wait(220);

      if (cdCommand && !skipCd) {
        await typeCommand(cdCommand);
        if (retainCdCommand) return;
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
      scheduleFrame(updateBackToTop);
    }, { passive: true });

    window.addEventListener("resize", updateBackToTop);
    backToTop.addEventListener("click", () => {
      const reduceScrollMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || phoneViewport.matches;
      window.scrollTo({ top: 0, behavior: reduceScrollMotion ? "auto" : "smooth" });
    });

    updateBackToTop();
  }

  const readingProgress = document.querySelector("[data-reading-progress]");
  if (readingProgress) {
    const fill = readingProgress.querySelector(".reading-progress__fill");
    const progressAnimation = typeof fill?.animate === "function"
      ? fill.animate(
        [
          { transform: "scaleX(0)" },
          { transform: "scaleX(1)" }
        ],
        {
          duration: 1000,
          fill: "both"
        }
      )
      : null;

    progressAnimation?.pause();

    let progressUpdatePending = false;
    const updateReadingProgress = () => {
      const scrollable = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = scrollable > 0
        ? Math.min(1, Math.max(0, window.scrollY / scrollable))
        : 0;

      readingProgress.hidden = progress < 0.012;
      if (progressAnimation) {
        progressAnimation.currentTime = progress * 1000;
      } else if (fill) {
        fill.style.transform = `scaleX(${progress})`;
      }
      progressUpdatePending = false;
    };

    const queueReadingProgressUpdate = () => {
      if (progressUpdatePending) return;
      progressUpdatePending = true;
      scheduleFrame(updateReadingProgress);
    };

    window.addEventListener("scroll", queueReadingProgressUpdate, { passive: true });
    window.addEventListener("resize", queueReadingProgressUpdate);
    updateReadingProgress();
  }

  const toc = document.querySelector("[data-toc]");
  if (toc) {
    const viewport = toc.querySelector("[data-toc-viewport]");
    const toggle = toc.querySelector("[data-toc-toggle]");
    const links = [...toc.querySelectorAll('a[href^="#"]')]
      .map((link) => {
        let target = null;
        try {
          target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        } catch {
          target = null;
        }
        const item = link.closest("li");
        return target && item ? { link, target, item } : null;
      })
      .filter(Boolean);

    if (viewport && toggle && links.length) {
      let activeIndex = 0;
      let expanded = false;
      let tocUpdatePending = false;

      links.forEach(({ item }) => {
        const siblings = [...(item.parentElement?.children ?? [])]
          .filter((sibling) => sibling.tagName === "LI");
        const originalPosition = siblings.indexOf(item);

        if (originalPosition >= 0) {
          const tocNumber = String(originalPosition + 1);
          item.setAttribute("value", tocNumber);
          item.dataset.tocNumber = tocNumber;
        }
      });

      const updateWindow = () => {
        links.forEach(({ link, item }, index) => {
          const distance = Math.abs(index - activeIndex);
          item.classList.toggle("is-active", index === activeIndex);
          item.classList.toggle("is-window-near", distance === 1);
          item.classList.toggle("is-window-far", distance === 2);
          item.classList.toggle("is-outside-window", !expanded && distance > 2);

          if (index === activeIndex) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });

        if (!expanded) {
          const activeLink = links[activeIndex]?.link;
          if (activeLink) {
            const viewportRect = viewport.getBoundingClientRect();
            const linkRect = activeLink.getBoundingClientRect();
            const nextScrollTop =
              viewport.scrollTop +
              linkRect.top -
              viewportRect.top -
              (viewport.clientHeight - linkRect.height) / 2;
            const maxScrollTop = Math.max(
              0,
              viewport.scrollHeight - viewport.clientHeight
            );

            viewport.scrollTop = Math.min(
              maxScrollTop,
              Math.max(0, nextScrollTop)
            );
          }
        }
      };

      const updateActiveHeading = () => {
        try {
          const activationLine = window.scrollY + Math.min(
            window.innerHeight * 0.36,
            260
          );
          let nextActiveIndex = 0;

          links.forEach(({ target }, index) => {
            const targetTop = target.getBoundingClientRect().top + window.scrollY;
            if (targetTop <= activationLine) {
              nextActiveIndex = index;
            }
          });

          const pageBottom =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 2;
          if (pageBottom) {
            nextActiveIndex = links.length - 1;
          }

          if (nextActiveIndex !== activeIndex) {
            activeIndex = nextActiveIndex;
            updateWindow();
          }
        } finally {
          tocUpdatePending = false;
        }
      };

      const queueTocUpdate = () => {
        if (tocUpdatePending || expanded) return;
        tocUpdatePending = true;
        window.setTimeout(updateActiveHeading, 24);
      };

      toggle.addEventListener("click", () => {
        expanded = !expanded;
        toc.classList.toggle("is-expanded", expanded);
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.textContent = expanded ? "Follow Reading" : "View All";
        updateWindow();
      });

      links.forEach(({ link }, index) => {
        link.addEventListener("click", () => {
          activeIndex = index;
          if (!expanded) updateWindow();
        });
      });

      window.addEventListener("scroll", queueTocUpdate, { passive: true });
      window.addEventListener("resize", queueTocUpdate);
      window.addEventListener("hashchange", queueTocUpdate);
      window.addEventListener("load", queueTocUpdate, { once: true });
      window.setInterval(() => {
        if (!expanded) updateActiveHeading();
      }, 200);

      if (typeof window.ResizeObserver === "function") {
        const tocResizeObserver = new window.ResizeObserver(() => {
          if (!expanded) updateWindow();
        });
        tocResizeObserver.observe(viewport);
      }

      updateActiveHeading();
      updateWindow();
    }
  }

  const asideSummaries = [...document.querySelectorAll("[data-aside-summary]")];
  if (asideSummaries.length) {
    document.addEventListener("click", (event) => {
      asideSummaries.forEach((summary) => {
        if (summary.open && !summary.contains(event.target)) {
          summary.removeAttribute("open");
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      asideSummaries.forEach((summary) => summary.removeAttribute("open"));
    });
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
