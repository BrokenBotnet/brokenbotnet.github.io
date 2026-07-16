document.addEventListener("DOMContentLoaded", () => {
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
