document.addEventListener("DOMContentLoaded", () => {
  const archiveFilter = document.querySelector("[data-archive-filter]");
  if (!archiveFilter) return;

  const queryInput = archiveFilter.querySelector('input[name="query"]');
  const tagSelect = archiveFilter.querySelector('select[name="tag"]');
  const status = archiveFilter.querySelector(".archive-filter__status");
  const posts = [...document.querySelectorAll("[data-post-item]")];
  if (!queryInput || !tagSelect || !status) return;

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
});
