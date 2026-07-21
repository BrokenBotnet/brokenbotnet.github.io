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

    const toolbar = document.createElement("div");
    toolbar.className = "lightbox__toolbar";
    toolbar.setAttribute("aria-label", "Image controls");

    const previousButton = document.createElement("button");
    previousButton.className = "lightbox__nav-button";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Previous image");
    previousButton.title = "Previous image";
    previousButton.textContent = "←";

    const positionLabel = document.createElement("span");
    positionLabel.className = "lightbox__position";
    positionLabel.setAttribute("aria-live", "polite");

    const zoomOutButton = document.createElement("button");
    zoomOutButton.className = "lightbox__zoom-button";
    zoomOutButton.type = "button";
    zoomOutButton.setAttribute("aria-label", "Zoom out");
    zoomOutButton.title = "Zoom out";
    zoomOutButton.textContent = "−";

    const zoomResetButton = document.createElement("button");
    zoomResetButton.className = "lightbox__zoom-reset";
    zoomResetButton.type = "button";
    zoomResetButton.setAttribute("aria-label", "Reset image zoom");
    zoomResetButton.title = "Reset zoom";
    zoomResetButton.textContent = "100%";

    const zoomInButton = document.createElement("button");
    zoomInButton.className = "lightbox__zoom-button";
    zoomInButton.type = "button";
    zoomInButton.setAttribute("aria-label", "Zoom in");
    zoomInButton.title = "Zoom in";
    zoomInButton.textContent = "+";

    const nextButton = document.createElement("button");
    nextButton.className = "lightbox__nav-button";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next image");
    nextButton.title = "Next image";
    nextButton.textContent = "→";

    toolbar.append(
      previousButton,
      positionLabel,
      zoomOutButton,
      zoomResetButton,
      zoomInButton,
      nextButton
    );

    const viewport = document.createElement("div");
    viewport.className = "lightbox__viewport";

    const previewImage = document.createElement("img");
    previewImage.className = "lightbox__image";
    previewImage.alt = "";
    viewport.append(previewImage);

    const caption = document.createElement("p");
    caption.className = "lightbox__caption";
    caption.hidden = true;

    frame.append(toolbar, viewport, caption);
    lightbox.append(closeButton, frame);
    document.body.append(lightbox);

    let activeImage = null;
    let activeIndex = 0;
    let scrollPosition = 0;
    const zoomLevels = [1, 1.5, 2, 3, 4];
    let zoomIndex = 0;
    let currentScale = 1;
    let panX = 0;
    let panY = 0;
    const pointers = new Map();
    let dragOrigin = null;
    let pinchOrigin = null;

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const clampPan = () => {
      const scale = currentScale;
      if (scale === 1 || !previewImage.clientWidth || !viewport.clientWidth) {
        panX = 0;
        panY = 0;
        return;
      }

      const maximumX = Math.max(0, (previewImage.clientWidth * scale - viewport.clientWidth) / 2);
      const maximumY = Math.max(0, (previewImage.clientHeight * scale - viewport.clientHeight) / 2);
      panX = clamp(panX, -maximumX, maximumX);
      panY = clamp(panY, -maximumY, maximumY);
    };

    const renderTransform = () => {
      clampPan();
      const scale = currentScale;
      previewImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      viewport.classList.toggle("is-zoomed", scale > 1);
      viewport.classList.toggle("is-dragging", pointers.size > 0 && scale > 1);
    };

    const updateZoomControls = () => {
      const zoom = Math.round(currentScale * 100);

      zoomResetButton.textContent = `${zoom}%`;
      zoomResetButton.setAttribute("aria-label", `Reset image zoom from ${zoom}%`);
      zoomOutButton.disabled = currentScale <= zoomLevels[0];
      zoomInButton.disabled = currentScale >= zoomLevels[zoomLevels.length - 1];
    };

    const updateZoom = (nextIndex, resetPan = false) => {
      zoomIndex = Math.max(0, Math.min(nextIndex, zoomLevels.length - 1));
      currentScale = zoomLevels[zoomIndex];

      if (resetPan || zoomIndex === 0) {
        panX = 0;
        panY = 0;
      }

      updateZoomControls();
      renderTransform();
    };

    const resetInteraction = () => {
      pointers.clear();
      dragOrigin = null;
      pinchOrigin = null;
      zoomIndex = 0;
      currentScale = 1;
      panX = 0;
      panY = 0;
      updateZoom(0, true);
    };

    const loadImage = (index) => {
      activeIndex = (index + lightboxImages.length) % lightboxImages.length;
      activeImage = lightboxImages[activeIndex];
      const image = activeImage;
      const figureCaption = image.closest("figure")?.querySelector("figcaption")?.textContent.trim();
      const description = figureCaption || image.alt.trim();

      previewImage.src = image.dataset.lightboxSrc || image.currentSrc || image.src;
      previewImage.alt = image.alt;
      caption.textContent = description;
      caption.hidden = !description;
      positionLabel.textContent = `${activeIndex + 1} / ${lightboxImages.length}`;
      previousButton.disabled = lightboxImages.length < 2;
      nextButton.disabled = lightboxImages.length < 2;
      resetInteraction();
    };

    const openLightbox = (index) => {
      scrollPosition = window.scrollY;
      loadImage(index);
      document.documentElement.classList.add("lightbox-open");

      if (typeof lightbox.showModal === "function") {
        lightbox.showModal();
      } else {
        lightbox.setAttribute("open", "");
      }

      closeButton.focus({ preventScroll: true });
    };

    const showAdjacentImage = (direction) => {
      if (lightboxImages.length < 2) return;
      loadImage(activeIndex + direction);
    };

    const closeLightbox = () => {
      if (typeof lightbox.close === "function") {
        lightbox.close();
      } else {
        lightbox.removeAttribute("open");
        lightbox.dispatchEvent(new Event("close"));
      }
    };

    lightboxImages.forEach((image, index) => {
      image.dataset.lightboxTrigger = "";
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", image.alt ? `Open image: ${image.alt}` : "Open image preview");

      image.addEventListener("click", () => openLightbox(index));
      image.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openLightbox(index);
      });
    });

    zoomOutButton.addEventListener("click", () => updateZoom(zoomIndex - 1));
    zoomResetButton.addEventListener("click", () => updateZoom(0, true));
    zoomInButton.addEventListener("click", () => updateZoom(zoomIndex + 1));
    previousButton.addEventListener("click", () => showAdjacentImage(-1));
    nextButton.addEventListener("click", () => showAdjacentImage(1));

    previewImage.addEventListener("load", renderTransform);
    window.addEventListener("resize", renderTransform);

    viewport.addEventListener("pointerdown", (event) => {
      if (currentScale === 1 && event.pointerType === "mouse") return;
      event.preventDefault();
      viewport.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 1) {
        dragOrigin = { x: event.clientX, y: event.clientY, panX, panY };
      } else if (pointers.size === 2) {
        const [first, second] = [...pointers.values()];
        pinchOrigin = {
          distance: Math.hypot(second.x - first.x, second.y - first.y),
          scale: currentScale,
          centerX: (first.x + second.x) / 2,
          centerY: (first.y + second.y) / 2,
          panX,
          panY
        };
      }

      renderTransform();
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2 && pinchOrigin) {
        const [first, second] = [...pointers.values()];
        const distance = Math.hypot(second.x - first.x, second.y - first.y);
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        const targetScale = clamp(
          pinchOrigin.scale * (distance / Math.max(1, pinchOrigin.distance)),
          zoomLevels[0],
          zoomLevels[zoomLevels.length - 1]
        );
        zoomIndex = zoomLevels.reduce((nearest, level, index) => (
          Math.abs(level - targetScale) < Math.abs(zoomLevels[nearest] - targetScale) ? index : nearest
        ), 0);
        currentScale = targetScale;
        panX = pinchOrigin.panX + centerX - pinchOrigin.centerX;
        panY = pinchOrigin.panY + centerY - pinchOrigin.centerY;
        updateZoomControls();
        renderTransform();
        return;
      }

      if (pointers.size === 1 && dragOrigin) {
        panX = dragOrigin.panX + event.clientX - dragOrigin.x;
        panY = dragOrigin.panY + event.clientY - dragOrigin.y;
        renderTransform();
      }
    });

    const releasePointer = (event) => {
      pointers.delete(event.pointerId);
      if (viewport.hasPointerCapture?.(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      pinchOrigin = null;

      const remaining = [...pointers.values()][0];
      dragOrigin = remaining ? { x: remaining.x, y: remaining.y, panX, panY } : null;
      renderTransform();
    };

    viewport.addEventListener("pointerup", releasePointer);
    viewport.addEventListener("pointercancel", releasePointer);
    viewport.addEventListener("lostpointercapture", (event) => {
      pointers.delete(event.pointerId);
      if (!pointers.size) {
        dragOrigin = null;
        pinchOrigin = null;
      }
      renderTransform();
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        updateZoom(zoomIndex + 1);
      } else if (event.key === "-") {
        event.preventDefault();
        updateZoom(zoomIndex - 1);
      } else if (event.key === "0") {
        event.preventDefault();
        updateZoom(0, true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showAdjacentImage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showAdjacentImage(1);
      }
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
      resetInteraction();
      previewImage.removeAttribute("src");
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
