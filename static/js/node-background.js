/*
 * Connected-node concept inspired by:
 * https://codepen.io/katedarby/pen/KMapRo
 *
 * MIT License
 * Copyright (c) 2026 Kate Darby
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Reimplemented without GSAP for the Broken Botnet Hugo site.
 */
(() => {
  const canvas = document.querySelector("[data-relay-network]");
  if (!canvas) return;

  const phoneViewport = window.matchMedia(
    "(max-width: 47.99rem), (max-height: 31rem) and (pointer: coarse)"
  );
  if (phoneViewport.matches) {
    canvas.hidden = true;
    return;
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const relayTypes = {
    bridge: { color: [192, 153, 255], radius: 1.8 },
    middle: { color: [122, 162, 247], radius: 1.5 },
    guard: { color: [98, 214, 181], radius: 2 },
    exit: { color: [255, 158, 100], radius: 1.9 }
  };
  const rolePattern = [
    "middle", "guard", "middle", "bridge", "middle", "guard",
    "middle", "exit", "middle", "middle", "guard", "middle",
    "bridge", "middle", "guard", "middle", "middle", "exit",
    "middle", "guard", "middle", "bridge", "middle", "middle"
  ];
  const normalFrameDuration = 1000 / 30;
  const readingFrameDuration = 1000 / 10;
  const pointer = { x: 0, y: 0, active: false };
  const sessionSeed = (() => {
    const storageKey = "brokenbotnet:relay-layout-seed";
    const generateSeed = () => {
      if (globalThis.crypto?.getRandomValues) {
        const values = new Uint32Array(2);
        globalThis.crypto.getRandomValues(values);
        return `${values[0].toString(36)}-${values[1].toString(36)}`;
      }

      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    };

    try {
      const storedSeed = window.sessionStorage.getItem(storageKey);
      if (storedSeed) return storedSeed;

      const generatedSeed = generateSeed();
      window.sessionStorage.setItem(storageKey, generatedSeed);
      return generatedSeed;
    } catch {
      return generateSeed();
    }
  })();

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let nodes = [];
  let circuits = [];
  let activeCircuit = null;
  let hoveredNode = null;
  let protectedRegions = [];
  let frame = 0;
  let lastTime = 0;
  let resizeFrame = 0;
  let scrollFrame = 0;
  let touchStart = null;
  let touchCircuitTimer = 0;
  let readingMode = false;
  const articlePage = Boolean(document.querySelector("article.post"));

  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

  const createRandom = (seedText) => {
    let seed = 2166136261;
    for (let index = 0; index < seedText.length; index += 1) {
      seed ^= seedText.charCodeAt(index);
      seed = Math.imul(seed, 16777619);
    }

    return () => {
      seed += 0x6d2b79f5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  };

  const distanceBetween = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);

  const mixColor = (first, second, ratio) => first.map((channel, index) => (
    Math.round(channel + (second[index] - channel) * ratio)
  ));

  const rgba = (color, alpha) => `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

  const targetNodeCount = () => {
    const mobile = width < 720;
    const calculated = Math.round((width * height) / (mobile ? 9000 : 12500));
    const responsiveCount = mobile
      ? clamp(calculated, 38, 64)
      : clamp(calculated, 72, 132);
    return saveData ? Math.min(26, responsiveCount) : responsiveCount;
  };

  const nodeEdgeInset = () => (width < 720 ? 10 : 9);

  const nodeMinimumDistance = () => {
    const densitySpacing = Math.sqrt((width * height) / Math.max(targetNodeCount(), 1));
    return clamp(densitySpacing * 0.38, width < 720 ? 24 : 30, width < 720 ? 38 : 46);
  };

  const createNode = (index) => {
    const random = createRandom(`${sessionSeed}-node-${index}`);
    const inset = nodeEdgeInset();
    const minimumDistance = nodeMinimumDistance();
    let bestCandidate = null;

    for (let attempt = 0; attempt < 18; attempt += 1) {
      const candidate = {
        x: inset + random() * Math.max(width - inset * 2, 1),
        y: inset + random() * Math.max(height - inset * 2, 1)
      };
      const nearestDistance = nodes.reduce((nearest, node) => (
        Math.min(nearest, distanceBetween(candidate, node))
      ), Number.POSITIVE_INFINITY);

      if (!bestCandidate || nearestDistance > bestCandidate.nearestDistance) {
        bestCandidate = { ...candidate, nearestDistance };
      }
      if (nearestDistance >= minimumDistance) break;
    }

    const position = bestCandidate || { x: width / 2, y: height / 2 };
    return {
      id: index,
      x: position.x,
      y: position.y,
      velocityX: (random() - 0.5) * 0.09,
      velocityY: (random() - 0.5) * 0.09,
      role: rolePattern[index % rolePattern.length],
      relay: relayTypes[rolePattern[index % rolePattern.length]],
      route: null
    };
  };

  const updateProtectedRegions = () => {
    protectedRegions = [...document.querySelectorAll(".page__body, .aside__panel")]
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.right > 0 &&
        rect.bottom > 0 &&
        rect.left < width &&
        rect.top < height
      ))
      .map((rect) => ({
        left: rect.left - 20,
        right: rect.right + 20,
        top: rect.top - 20,
        bottom: rect.bottom + 20
      }));
  };

  const visibilityAt = (x, y) => {
    const horizontalEdge = Math.abs(x - width / 2) / Math.max(width / 2, 1);
    const verticalEdge = Math.abs(y - height / 2) / Math.max(height / 2, 1);
    const edgeDistance = Math.max(horizontalEdge, verticalEdge);
    let visibility = 0.36 + Math.pow(edgeDistance, 1.35) * 0.64;

    protectedRegions.forEach((rect) => {
      const deltaX = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const deltaY = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const distance = Math.hypot(deltaX, deltaY);
      const protection = 0.13 + clamp(distance / 105, 0, 1) * 0.87;
      visibility = Math.min(visibility, protection);
    });

    return visibility;
  };

  const segmentControl = (start, end, direction) => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.max(Math.hypot(deltaX, deltaY), 1);
    const bend = Math.min(22, length * 0.085) * direction;
    return {
      x: (start.x + end.x) / 2 - (deltaY / length) * bend,
      y: (start.y + end.y) / 2 + (deltaX / length) * bend
    };
  };

  const pointOnSegment = (start, end, ratio, direction) => {
    const control = segmentControl(start, end, direction);
    const inverse = 1 - ratio;
    return {
      x: inverse * inverse * start.x + 2 * inverse * ratio * control.x + ratio * ratio * end.x,
      y: inverse * inverse * start.y + 2 * inverse * ratio * control.y + ratio * ratio * end.y
    };
  };

  const segmentsCross = (firstStart, firstEnd, secondStart, secondEnd) => {
    if (
      firstStart === secondStart ||
      firstStart === secondEnd ||
      firstEnd === secondStart ||
      firstEnd === secondEnd
    ) return false;

    const orientation = (first, second, third) => (
      (second.x - first.x) * (third.y - first.y) -
      (second.y - first.y) * (third.x - first.x)
    );
    const firstSide = orientation(firstStart, firstEnd, secondStart);
    const secondSide = orientation(firstStart, firstEnd, secondEnd);
    const thirdSide = orientation(secondStart, secondEnd, firstStart);
    const fourthSide = orientation(secondStart, secondEnd, firstEnd);
    return firstSide * secondSide < 0 && thirdSide * fourthSide < 0;
  };

  const routeDimensions = () => {
    const shortestSide = Math.min(width, height);
    const desktop = width >= 1024;
    return {
      ideal: clamp(shortestSide * 0.27, 145, desktop ? 260 : 300),
      maximum: clamp(shortestSide * 0.5, 240, desktop ? 360 : 440)
    };
  };

  const candidateScore = (source, candidate, options = {}) => {
    const { ideal, maximum } = routeDimensions();
    const length = distanceBetween(source, candidate);
    const usage = options.usage?.get(candidate.id) || 0;
    const verticalDistance = Math.abs(candidate.y - source.y);
    const horizontalDistance = Math.abs(candidate.x - source.x);
    const crossingCount = (options.segments || []).reduce((count, segment) => (
      count + (segmentsCross(source, candidate, segment.start, segment.end) ? 1 : 0)
    ), 0);
    const random = createRandom(
      `${sessionSeed}-route-${options.phase || "route"}-${source.id}-${candidate.id}`
    );
    let score = Math.abs(length - ideal) / ideal;

    if (length < ideal * 0.42) score += (ideal * 0.42 - length) / ideal;
    if (verticalDistance > horizontalDistance * 1.8 && length > height * 0.34) score += 2.2;
    if (options.balance) score += Math.abs(length - options.balance) / ideal * 0.55;

    score += usage * 0.78;
    score += crossingCount * 1.45;
    score += random() * 0.12;
    return score;
  };

  const chooseRouteNode = (source, candidates, options = {}) => {
    const { ideal, maximum } = routeDimensions();
    const nearby = candidates.filter((candidate) => distanceBetween(source, candidate) <= maximum);
    const pool = nearby.length ? nearby : candidates;
    return pool
      .reduce((best, candidate) => {
        const length = distanceBetween(source, candidate);
        const overflowPenalty = nearby.length ? 0 : Math.max(0, length - maximum) / ideal * 3.2;
        const score = candidateScore(source, candidate, options) + overflowPenalty;
        return !best || score < best.score ? { node: candidate, score } : best;
      }, null)?.node || null;
  };

  const makeRouteForNode = (node, entries, middles, exits) => {
    const emptyUsage = new Map();
    const options = { usage: emptyUsage, segments: [], phase: `hover-${node.role}` };
    let entry;
    let middle;
    let exit;

    if (node.role === "bridge" || node.role === "guard") {
      entry = node;
      middle = chooseRouteNode(entry, middles, options);
      exit = middle ? chooseRouteNode(middle, exits, {
        ...options,
        balance: distanceBetween(entry, middle),
        phase: "hover-exit"
      }) : null;
    } else if (node.role === "middle") {
      middle = node;
      entry = chooseRouteNode(middle, entries, { ...options, phase: "hover-entry" });
      exit = chooseRouteNode(middle, exits, {
        ...options,
        balance: entry ? distanceBetween(entry, middle) : 0,
        phase: "hover-exit"
      });
    } else {
      exit = node;
      middle = chooseRouteNode(exit, middles, { ...options, phase: "hover-middle" });
      entry = middle ? chooseRouteNode(middle, entries, {
        ...options,
        balance: distanceBetween(middle, exit),
        phase: "hover-entry"
      }) : null;
    }

    return entry && middle && exit ? {
      entry,
      middle,
      exit,
      progress: (node.id * 0.137) % 1,
      signal: false
    } : null;
  };

  const rebuildCircuits = () => {
    const entries = nodes.filter((node) => node.role === "bridge" || node.role === "guard");
    const middles = nodes.filter((node) => node.role === "middle");
    const exits = nodes.filter((node) => node.role === "exit");
    const mobile = width < 720;
    const circuitLimit = Math.min(
      entries.length,
      clamp(Math.round(nodes.length * 0.24), mobile ? 9 : 14, mobile ? 16 : 28)
    );
    const foregroundLimit = clamp(Math.round(circuitLimit * 0.28), 3, mobile ? 4 : 5);
    const rankedEntries = entries
      .map((node) => ({
        node,
        rank: createRandom(`${sessionSeed}-entry-${node.id}`)()
      }))
      .sort((first, second) => first.rank - second.rank)
      .map((item) => item.node);
    const firstGuard = rankedEntries.find((node) => node.role === "guard");
    const firstBridge = rankedEntries.find((node) => node.role === "bridge");
    const orderedEntries = [];

    if (firstGuard) orderedEntries.push(firstGuard);
    if (firstBridge) orderedEntries.push(firstBridge);
    rankedEntries.forEach((node) => {
      if (!orderedEntries.includes(node)) orderedEntries.push(node);
    });

    const usage = new Map();
    const segments = [];
    circuits = [];
    for (const entry of orderedEntries) {
      if (circuits.length >= circuitLimit) break;
      const index = circuits.length;
      const middle = chooseRouteNode(entry, middles, {
        usage,
        segments,
        phase: `middle-${index}`
      });
      const firstLength = middle ? distanceBetween(entry, middle) : 0;
      const exit = middle ? chooseRouteNode(middle, exits, {
        usage,
        segments,
        balance: firstLength,
        phase: `exit-${index}`
      }) : null;

      if (!middle || !exit) continue;

      usage.set(middle.id, (usage.get(middle.id) || 0) + 1);
      usage.set(exit.id, (usage.get(exit.id) || 0) + 1);
      segments.push({ start: entry, end: middle }, { start: middle, end: exit });
      circuits.push({
        entry,
        middle,
        exit,
        progress: (index * 0.173) % 1,
        featured: index < foregroundLimit,
        signal: index < foregroundLimit
      });
    }

    nodes.forEach((node) => {
      node.route = circuits.find((circuit) => (
        circuit.entry === node || circuit.middle === node || circuit.exit === node
      )) || makeRouteForNode(node, entries, middles, exits);
    });

    activeCircuit = null;
    hoveredNode = null;
    canvas.classList.remove("is-route-active");
  };

  const reconcileNodes = (previousWidth, previousHeight) => {
    const inset = nodeEdgeInset();
    if (nodes.length && previousWidth && previousHeight) {
      nodes.forEach((node) => {
        node.x = clamp((node.x / previousWidth) * width, inset, width - inset);
        node.y = clamp((node.y / previousHeight) * height, inset, height - inset);
      });
    }

    const count = targetNodeCount();
    if (nodes.length > count) nodes = nodes.slice(0, count);
    while (nodes.length < count) nodes.push(createNode(nodes.length));
    rebuildCircuits();
  };

  const resizeCanvas = () => {
    const previousWidth = width;
    const previousHeight = height;
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    updateProtectedRegions();
    reconcileNodes(previousWidth, previousHeight);
    draw();
  };

  const routeContains = (circuit, node) => Boolean(circuit && (
    circuit.entry === node || circuit.middle === node || circuit.exit === node
  ));

  const drawSegment = (start, end, options = {}) => {
    const { active = false, direction = 1, dimmed = false, featured = false } = options;
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    const visibility = visibilityAt(midpointX, midpointY);
    const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
    const baseAlpha = active
      ? 0.62 * (0.58 + visibility * 0.42)
      : (featured ? 0.24 : 0.14) * visibility * (dimmed ? 0.23 : 1);
    const control = segmentControl(start, end, direction);

    gradient.addColorStop(0, rgba(start.relay.color, baseAlpha * 0.46));
    gradient.addColorStop(0.48, rgba(mixColor(start.relay.color, end.relay.color, 0.48), baseAlpha));
    gradient.addColorStop(1, rgba(end.relay.color, baseAlpha * 0.58));

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);
    if (active) {
      context.strokeStyle = rgba(
        mixColor(start.relay.color, end.relay.color, 0.5),
        0.1 * (0.7 + visibility * 0.3)
      );
      context.lineWidth = 2.35;
      context.lineCap = "round";
      context.stroke();
    }

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);
    context.strokeStyle = gradient;
    context.lineWidth = active ? 1.02 : 0.66;
    context.lineCap = "round";
    context.stroke();
    context.lineCap = "butt";
  };

  const drawDirectionMarker = (start, end, ratio, direction) => {
    const before = pointOnSegment(start, end, clamp(ratio - 0.025, 0, 1), direction);
    const point = pointOnSegment(start, end, ratio, direction);
    const after = pointOnSegment(start, end, clamp(ratio + 0.025, 0, 1), direction);
    const angle = Math.atan2(after.y - before.y, after.x - before.x);
    const markerScale = width >= 1024 ? 0.86 : 1;
    const size = 3.2 * markerScale;
    const wing = 1.9 * markerScale;
    const color = mixColor(start.relay.color, end.relay.color, ratio);
    const backX = point.x - Math.cos(angle) * size;
    const backY = point.y - Math.sin(angle) * size;

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(
      backX + Math.cos(angle + Math.PI / 2) * wing,
      backY + Math.sin(angle + Math.PI / 2) * wing
    );
    context.lineTo(
      backX + Math.cos(angle - Math.PI / 2) * wing,
      backY + Math.sin(angle - Math.PI / 2) * wing
    );
    context.closePath();
    context.fillStyle = rgba(color, 0.76);
    context.fill();
  };

  const drawConnections = () => {
    const dimmed = Boolean(activeCircuit);
    circuits.forEach((circuit) => {
      if (circuit === activeCircuit) return;
      drawSegment(circuit.entry, circuit.middle, {
        direction: 1,
        dimmed,
        featured: circuit.featured
      });
      drawSegment(circuit.middle, circuit.exit, {
        direction: -1,
        dimmed,
        featured: circuit.featured
      });
    });

    if (activeCircuit) {
      drawSegment(activeCircuit.entry, activeCircuit.middle, { active: true, direction: 1 });
      drawSegment(activeCircuit.middle, activeCircuit.exit, { active: true, direction: -1 });
      drawDirectionMarker(activeCircuit.entry, activeCircuit.middle, 0.58, 1);
      drawDirectionMarker(activeCircuit.middle, activeCircuit.exit, 0.58, -1);
    }
  };

  const drawNodes = () => {
    nodes.forEach((node) => {
      const visibility = visibilityAt(node.x, node.y);
      const active = routeContains(activeCircuit, node);
      const hovered = node === hoveredNode;
      const unrelatedScale = activeCircuit && !active && !hovered ? 0.32 : 1;
      context.beginPath();
      const activeGrowth = width >= 1024 ? 0.32 : 0.45;
      context.arc(node.x, node.y, node.relay.radius + (active ? activeGrowth : 0), 0, Math.PI * 2);
      context.fillStyle = rgba(
        node.relay.color,
        hovered ? 0.98 : active ? 0.9 : 0.78 * visibility * unrelatedScale
      );
      context.fill();
    });
  };

  const drawRouteRings = () => {
    if (!activeCircuit) return;

    [activeCircuit.entry, activeCircuit.middle, activeCircuit.exit].forEach((node) => {
      const hovered = node === hoveredNode;
      const desktop = width >= 1024;
      const ringGap = desktop
        ? (hovered ? 2.45 : 1.7)
        : (hovered ? 3 : 2.2);
      context.beginPath();
      context.arc(node.x, node.y, node.relay.radius + ringGap, 0, Math.PI * 2);
      context.strokeStyle = rgba(node.relay.color, hovered ? 0.9 : 0.64);
      context.lineWidth = desktop
        ? (hovered ? 0.86 : 0.62)
        : (hovered ? 1 : 0.72);
      context.stroke();
    });
  };

  const pointAlongCircuit = (circuit, progress = circuit.progress) => {
    const firstLength = distanceBetween(circuit.entry, circuit.middle);
    const secondLength = distanceBetween(circuit.middle, circuit.exit);
    const totalLength = Math.max(firstLength + secondLength, 1);
    const traveled = clamp(progress, 0, 1) * totalLength;
    const firstSegment = traveled <= firstLength;
    const start = firstSegment ? circuit.entry : circuit.middle;
    const end = firstSegment ? circuit.middle : circuit.exit;
    const segmentDistance = firstSegment ? traveled : traveled - firstLength;
    const segmentLength = Math.max(firstSegment ? firstLength : secondLength, 1);
    const ratio = clamp(segmentDistance / segmentLength, 0, 1);
    const direction = firstSegment ? 1 : -1;
    const point = pointOnSegment(start, end, ratio, direction);

    return {
      x: point.x,
      y: point.y,
      color: mixColor(start.relay.color, end.relay.color, ratio)
    };
  };

  const drawSignalTrail = (circuit, tailProgress, headProgress, color) => {
    const tail = pointAlongCircuit(circuit, tailProgress);
    const head = pointAlongCircuit(circuit, headProgress);
    const gradient = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
    gradient.addColorStop(0, rgba(color, 0));
    gradient.addColorStop(1, rgba(color, 0.84));
    context.beginPath();

    for (let index = 0; index <= 14; index += 1) {
      const ratio = index / 14;
      const point = pointAlongCircuit(
        circuit,
        tailProgress + (headProgress - tailProgress) * ratio
      );
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }

    context.strokeStyle = gradient;
    context.lineWidth = 1.08;
    context.lineCap = "round";
    context.stroke();
    context.lineCap = "butt";
  };

  const drawSignals = () => {
    if (readingMode) return;

    const drawSignal = (circuit, active) => {
      const signal = pointAlongCircuit(circuit);
      const visibility = visibilityAt(signal.x, signal.y);
      const endpointFade = Math.min(
        1,
        circuit.progress / 0.055,
        (1 - circuit.progress) / 0.055
      );

      if (active && circuit.progress > 0.036) {
        drawSignalTrail(
          circuit,
          Math.max(0, circuit.progress - 0.042),
          circuit.progress,
          signal.color
        );
      }

      context.beginPath();
      context.arc(signal.x, signal.y, active ? 1.4 : 0.95, 0, Math.PI * 2);
      context.fillStyle = rgba(
        signal.color,
        (active ? 0.96 : 0.74 * visibility) * endpointFade
      );
      context.fill();
    };

    circuits.forEach((circuit) => {
      if (!circuit.signal && circuit !== activeCircuit) return;
      drawSignal(circuit, circuit === activeCircuit);
    });

    if (activeCircuit && !circuits.includes(activeCircuit)) drawSignal(activeCircuit, true);
  };

  function draw() {
    context.clearRect(0, 0, width, height);
    drawConnections();
    drawSignals();
    drawNodes();
    drawRouteRings();
  }

  const updateNetwork = (elapsed) => {
    const activityScale = readingMode ? 0.1 : 1;
    const timeScale = Math.min(2, elapsed / 16.67) * activityScale;
    const inset = nodeEdgeInset();
    nodes.forEach((node) => {
      node.x += node.velocityX * timeScale;
      node.y += node.velocityY * timeScale;

      if (node.x <= inset || node.x >= width - inset) {
        node.x = clamp(node.x, inset, width - inset);
        node.velocityX *= -1;
      }
      if (node.y <= inset || node.y >= height - inset) {
        node.y = clamp(node.y, inset, height - inset);
        node.velocityY *= -1;
      }
    });

    if (!readingMode) {
      circuits.forEach((circuit) => {
        const speed = circuit === activeCircuit ? 0.00014 : 0.00004;
        circuit.progress = (circuit.progress + elapsed * speed) % 1;
      });

      if (activeCircuit && !circuits.includes(activeCircuit)) {
        activeCircuit.progress = (activeCircuit.progress + elapsed * 0.00014) % 1;
      }
    }
  };

  const animate = (timestamp) => {
    const targetFrameDuration = readingMode ? readingFrameDuration : normalFrameDuration;
    const elapsed = lastTime ? timestamp - lastTime : targetFrameDuration;
    if (elapsed < targetFrameDuration) {
      frame = window.requestAnimationFrame(animate);
      return;
    }

    lastTime = timestamp;
    updateNetwork(elapsed);
    draw();
    frame = window.requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  };

  const startAnimation = () => {
    stopAnimation();
    if (reducedMotion.matches || saveData || document.hidden) {
      draw();
      return;
    }
    frame = window.requestAnimationFrame(animate);
  };

  const updateActiveCircuit = (options = {}) => {
    const touch = Boolean(options.touch);
    if (!pointer.active || readingMode) {
      activeCircuit = null;
      hoveredNode = null;
      canvas.classList.remove("is-route-active");
      return;
    }

    const nearest = nodes.reduce((selected, node) => {
      if (visibilityAt(node.x, node.y) < (touch ? 0.1 : 0.22) || !node.route) return selected;
      const distance = distanceBetween(pointer, node);
      return !selected || distance < selected.distance ? { node, distance } : selected;
    }, null);
    const hoverRange = touch
      ? clamp(width * 0.18, 72, 96)
      : clamp(width * 0.045, 58, 76);
    const nextNode = nearest && nearest.distance <= hoverRange ? nearest.node : null;
    const nextCircuit = nextNode?.route || null;

    if (nextCircuit && nextCircuit !== activeCircuit) nextCircuit.progress = 0;
    hoveredNode = nextNode;
    activeCircuit = nextCircuit;
    canvas.classList.toggle("is-route-active", Boolean(activeCircuit));
  };

  const clearTouchCircuit = () => {
    if (touchCircuitTimer) window.clearTimeout(touchCircuitTimer);
    touchCircuitTimer = 0;
    pointer.active = false;
    activeCircuit = null;
    hoveredNode = null;
    canvas.classList.remove("is-route-active");
    if (reducedMotion.matches || saveData || document.hidden) draw();
  };

  const traceTouchCircuit = (event) => {
    if (readingMode || !touchStart) return;
    const moved = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
    const elapsed = Date.now() - touchStart.time;
    const target = event.target instanceof Element ? event.target : null;
    const interactive = target?.closest("a, button, input, select, textarea, summary, [role='button']");
    touchStart = null;
    if (moved > 12 || elapsed > 700 || interactive) return;

    const previousCircuit = activeCircuit;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    updateActiveCircuit({ touch: true });

    if (!activeCircuit || activeCircuit === previousCircuit) {
      clearTouchCircuit();
      return;
    }

    if (touchCircuitTimer) window.clearTimeout(touchCircuitTimer);
    touchCircuitTimer = window.setTimeout(clearTouchCircuit, 3200);
    if (reducedMotion.matches || saveData || document.hidden) draw();
  };

  const updateReadingMode = () => {
    updateProtectedRegions();
    if (!articlePage) return;

    const readingStart = Math.min(520, Math.max(280, window.innerHeight * 0.38));
    const footerRange = Math.max(340, window.innerHeight * 0.3);
    const nearFooter = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - footerRange;
    const nextReadingMode = window.scrollY > readingStart && !nearFooter;
    if (nextReadingMode === readingMode) return;

    readingMode = nextReadingMode;
    lastTime = 0;
    canvas.classList.toggle("is-reading-mode", readingMode);
    if (readingMode) {
      activeCircuit = null;
      hoveredNode = null;
      canvas.classList.remove("is-route-active");
    } else {
      updateActiveCircuit();
    }
    if (reducedMotion.matches || saveData || document.hidden) draw();
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || width < 720) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    updateActiveCircuit();
    if (reducedMotion.matches || saveData || document.hidden) draw();
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" && width >= 720) return;
    touchStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  }, { passive: true });

  window.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch" && width >= 720) return;
    traceTouchCircuit(event);
  }, { passive: true });

  window.addEventListener("pointercancel", () => {
    touchStart = null;
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => {
    if (width < 720 && touchCircuitTimer) return;
    pointer.active = false;
    activeCircuit = null;
    hoveredNode = null;
    canvas.classList.remove("is-route-active");
    if (reducedMotion.matches || saveData || document.hidden) draw();
  });

  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateReadingMode();
    });
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
      updateReadingMode();
      updateActiveCircuit();
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", startAnimation);
  reducedMotion.addEventListener("change", startAnimation);

  resizeCanvas();
  updateReadingMode();
  startAnimation();
})();
