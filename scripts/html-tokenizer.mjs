const htmlWhitespace = new Set(["\t", "\n", "\f", "\r", " "]);

const isWhitespace = (character) => htmlWhitespace.has(character);

const isTagNameBoundary = (character) =>
  character === undefined || isWhitespace(character) || character === "/" || character === ">";

const findTagEnd = (html, start) => {
  let quote;

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];

    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }

    if (character === '"' || character === "'") quote = character;
    else if (character === ">") return index;
  }

  return -1;
};

const parseAttributes = (source) => {
  const attributes = [];
  let index = 0;

  while (index < source.length) {
    while (isWhitespace(source[index]) || source[index] === "/") index += 1;
    if (index >= source.length) break;

    const nameStart = index;
    while (
      index < source.length &&
      !isWhitespace(source[index]) &&
      source[index] !== "/" &&
      source[index] !== "="
    ) {
      index += 1;
    }

    const name = source.slice(nameStart, index).toLowerCase();
    if (!name) {
      index += 1;
      continue;
    }

    while (isWhitespace(source[index])) index += 1;
    let value;

    if (source[index] === "=") {
      index += 1;
      while (isWhitespace(source[index])) index += 1;

      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) index += 1;
        value = source.slice(valueStart, index);
        if (source[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < source.length && !isWhitespace(source[index])) {
          index += 1;
        }
        value = source.slice(valueStart, index);
      }
    }

    attributes.push({ name, value });
  }

  return attributes;
};

const readTag = (html, start) => {
  let index = start + 1;
  const closing = html[index] === "/";
  if (closing) index += 1;

  const nameStart = index;
  while (index < html.length && !isTagNameBoundary(html[index])) index += 1;
  if (index === nameStart) return undefined;

  const name = html.slice(nameStart, index).toLowerCase();
  const end = findTagEnd(html, index);
  if (end === -1) return { error: `unclosed <${closing ? "/" : ""}${name}> tag` };

  return {
    closing,
    name,
    attributes: closing ? [] : parseAttributes(html.slice(index, end)),
    raw: html.slice(start, end + 1),
    end,
  };
};

const findScriptEnd = (html, start) => {
  const lowerHtml = html.toLowerCase();
  let searchFrom = start;

  while (searchFrom < html.length) {
    const opening = lowerHtml.indexOf("</script", searchFrom);
    if (opening === -1) return undefined;

    const index = opening + "</script".length;
    if (!isTagNameBoundary(html[index])) {
      searchFrom = index;
      continue;
    }

    const end = findTagEnd(html, index);
    if (end === -1) return undefined;
    return { opening, end };
  }

  return undefined;
};

export const attributeValue = (tag, name) =>
  tag.attributes.find((attribute) => attribute.name === name.toLowerCase())?.value;

export const normalizeAttributeUrl = (value = "") => value
  .replace(/&#(?:x([\da-f]+)|([\d]+));?/gi, (_, hexadecimal, decimal) => {
    const codePoint = Number.parseInt(hexadecimal ?? decimal, hexadecimal ? 16 : 10);
    return Number.isFinite(codePoint) && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : "\ufffd";
  })
  .replace(/&(?:colon|tab|newline);/gi, (reference) => ({
    "&colon;": ":",
    "&newline;": "\n",
    "&tab;": "\t",
  })[reference.toLowerCase()])
  .replace(/[\u0000-\u0020\u007f]+/g, "")
  .toLowerCase();

export const tokenizeHtml = (html) => {
  const tags = [];
  const scripts = [];
  const errors = [];
  let index = 0;

  while (index < html.length) {
    const start = html.indexOf("<", index);
    if (start === -1) break;

    if (html.startsWith("<!--", start)) {
      const end = html.indexOf("-->", start + 4);
      if (end === -1) {
        errors.push("unclosed HTML comment");
        break;
      }
      index = end + 3;
      continue;
    }

    if (html[start + 1] === "!" || html[start + 1] === "?") {
      const end = findTagEnd(html, start + 2);
      if (end === -1) {
        errors.push("unclosed HTML declaration");
        break;
      }
      index = end + 1;
      continue;
    }

    const tag = readTag(html, start);
    if (!tag) {
      index = start + 1;
      continue;
    }
    if (tag.error) {
      errors.push(tag.error);
      break;
    }

    tags.push(tag);
    index = tag.end + 1;

    if (!tag.closing && tag.name === "script") {
      const closing = findScriptEnd(html, index);
      if (!closing) {
        errors.push("unclosed <script> element");
        break;
      }

      scripts.push({ ...tag, body: html.slice(index, closing.opening) });
      index = closing.end + 1;
    }
  }

  return { errors, scripts, tags };
};
