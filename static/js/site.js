document.addEventListener("DOMContentLoaded", () => {
  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const phoneViewport = window.matchMedia(
    "(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)"
  );
  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || phoneViewport.matches;

  document.querySelectorAll("[data-node-sync]").forEach((terminal) => {
    const path = terminal.querySelector("[data-terminal-path]");
    const command = terminal.querySelector("[data-terminal-command]");
    if (!path || !command) return;

    const commands = [
      { network: "bitcoin", command: "bitcoin-cli getblockchaininfo" },
      { network: "monero", command: "monerod sync_info" },
    ];
    const playbackKey = "brokenbotnet:donate-node-sync-played";
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
    let hasPlayed = false;

    try {
      hasPlayed = window.sessionStorage.getItem(playbackKey) === "true";
    } catch {
      hasPlayed = false;
    }

    document.addEventListener("visibilitychange", updateVisibility);
    updateVisibility();

    if (reduceMotion || hasPlayed) {
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

      try {
        window.sessionStorage.setItem(playbackKey, "true");
      } catch {
        // The animation remains functional when session storage is unavailable.
      }
    };

    runNodeSync();
  });

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

    const setPath = (value, linkFinalPath = false) => {
      path.textContent = "";
      if (value.startsWith("~")) {
        const home = document.createElement("a");
        home.className = "prompt__home-link";
        home.href = homeLink;
        home.textContent = "~";
        home.setAttribute("aria-label", "Go to Home");
        home.title = "Home";
        path.append(home);

        const remainder = value.slice(1);
        if (!(linkFinalPath && pathLink && remainder === "/writing")) {
          path.append(document.createTextNode(remainder));
          return;
        }

        path.append(document.createTextNode("/"));
        const link = document.createElement("a");
        link.className = "prompt__cwd-link";
        link.href = pathLink;
        link.textContent = "writing";
        link.setAttribute("aria-label", "Open Writing archive");
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

  document.querySelectorAll(".highlight").forEach((block) => {
    const pre = block.querySelector("pre");
    const code = block.querySelector("code");
    if (!pre || !code || block.querySelector(".code-block__toolbar")) return;

    const languageClass = [...code.classList].find((className) => className.startsWith("language-"));
    const language = languageClass ? languageClass.replace("language-", "") : "text";
    const toolbar = document.createElement("div");
    toolbar.className = "code-block__toolbar";

    const dots = document.createElement("span");
    dots.className = "code-block__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));

    const languageLabel = document.createElement("span");
    languageLabel.className = "code-block__language";
    languageLabel.textContent = language;

    const copyButton = document.createElement("button");
    copyButton.className = "code-block__copy";
    copyButton.type = "button";
    copyButton.setAttribute("aria-label", "Copy code to clipboard");

    const copyIcon = document.createElement("i");
    copyIcon.setAttribute("data-lucide", "copy");
    const copyLabel = document.createElement("span");
    copyLabel.textContent = "Copy";
    copyButton.append(copyIcon, copyLabel);
    toolbar.append(dots, languageLabel, copyButton);

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        copyButton.classList.add("is-copied");
        copyLabel.textContent = "Copied";
      } catch {
        copyLabel.textContent = "Copy failed";
      }

      window.setTimeout(() => {
        copyButton.classList.remove("is-copied");
        copyLabel.textContent = "Copy";
      }, 1800);
    });

    block.prepend(toolbar);
  });

  const archiveFilter = document.querySelector("[data-archive-filter]");
  if (archiveFilter) {
    const queryInput = archiveFilter.querySelector('input[name="query"]');
    const tagSelect = archiveFilter.querySelector('select[name="tag"]');
    const status = archiveFilter.querySelector(".archive-filter__status");
    const posts = [...document.querySelectorAll("[data-post-item]")];
    const normalizeFilterValue = (value) => value
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase("en-US")
      .slice(0, 120);

    const updateArchive = () => {
      const query = normalizeFilterValue(queryInput.value);
      const tag = normalizeFilterValue(tagSelect.value);
      let visible = 0;

      posts.forEach((post) => {
        const matchesQuery = !query || post.dataset.search.includes(query);
        const tags = post.dataset.tags ? post.dataset.tags.split(",") : [];
        const matchesTag = !tag || tags.includes(tag);
        post.hidden = !(matchesQuery && matchesTag);
        if (!post.hidden) visible += 1;
      });

      status.textContent = `${visible} ${visible === 1 ? "article" : "articles"} shown`;
    };

    queryInput.addEventListener("input", updateArchive);
    tagSelect.addEventListener("change", updateArchive);
    archiveFilter.addEventListener("submit", (event) => event.preventDefault());
    updateArchive();
  }

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

  document.querySelectorAll("[data-copy-address]").forEach((button) => {
    const label = button.querySelector("span");
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

  const lightboxImages = [...document.querySelectorAll(".content__body img")].filter((image) => (
    !image.closest("a") && !image.closest(".project-badge")
  ));

  if (lightboxImages.length) {
    const lightbox = document.createElement("dialog");
    lightbox.className = "lightbox";
    lightbox.setAttribute("aria-label", "Image preview");

    const closeButton = document.createElement("button");
    closeButton.className = "lightbox__close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close image preview");
    closeButton.title = "Close";

    const closeIcon = document.createElement("i");
    closeIcon.setAttribute("data-lucide", "x");
    closeButton.append(closeIcon);

    const frame = document.createElement("div");
    frame.className = "lightbox__frame";

    const previewImage = document.createElement("img");
    previewImage.className = "lightbox__image";
    previewImage.alt = "";

    const caption = document.createElement("p");
    caption.className = "lightbox__caption";
    caption.hidden = true;

    frame.append(previewImage, caption);
    lightbox.append(closeButton, frame);
    document.body.append(lightbox);

    let activeImage = null;
    let scrollPosition = 0;

    const openLightbox = (image) => {
      const figureCaption = image.closest("figure")?.querySelector("figcaption")?.textContent.trim();
      const description = figureCaption || image.alt.trim();

      activeImage = image;
      scrollPosition = window.scrollY;
      previewImage.src = image.dataset.lightboxSrc || image.currentSrc || image.src;
      previewImage.alt = image.alt;
      caption.textContent = description;
      caption.hidden = !description;
      document.documentElement.classList.add("lightbox-open");

      if (typeof lightbox.showModal === "function") {
        lightbox.showModal();
      } else {
        lightbox.setAttribute("open", "");
      }

      closeButton.focus({ preventScroll: true });
    };

    const closeLightbox = () => {
      if (typeof lightbox.close === "function") {
        lightbox.close();
      } else {
        lightbox.removeAttribute("open");
        lightbox.dispatchEvent(new Event("close"));
      }
    };

    lightboxImages.forEach((image) => {
      image.dataset.lightboxTrigger = "";
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", image.alt ? `Open image: ${image.alt}` : "Open image preview");

      image.addEventListener("click", () => openLightbox(image));
      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openLightbox(image);
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });
    lightbox.addEventListener("close", () => {
      document.documentElement.classList.remove("lightbox-open");
      activeImage?.focus({ preventScroll: true });
      window.scrollTo(0, scrollPosition);
      activeImage = null;
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
