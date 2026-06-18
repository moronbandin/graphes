"use strict";

const state = {
  all: [],
  visible: [],
  currentIndex: 0,
  imageFile: null,
  previewUrl: null,
};

const els = {
  gallery: document.querySelector("#gallery"),
  resultCount: document.querySelector("#resultCount"),
  totalCount: document.querySelector("#totalCount"),
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categoryFilter"),
  sort: document.querySelector("#sortSelect"),
  activeFilters: document.querySelector("#activeFilters"),
  empty: document.querySelector("#emptyState"),
  error: document.querySelector("#loadError"),
  imageDialog: document.querySelector("#imageDialog"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogTranscription: document.querySelector("#dialogTranscription"),
  dialogCategory: document.querySelector("#dialogCategory"),
  dialogLocation: document.querySelector("#dialogLocation"),
  dialogEtymology: document.querySelector("#dialogEtymology"),
  dialogComment: document.querySelector("#dialogComment"),
  imagePosition: document.querySelector("#imagePosition"),
  aboutDialog: document.querySelector("#aboutDialog"),
  contributeDialog: document.querySelector("#contributeDialog"),
  form: document.querySelector("#contributionForm"),
  imageInput: document.querySelector("#imageInput"),
  uploadPreview: document.querySelector("#uploadPreview"),
  dropPlaceholder: document.querySelector("#dropPlaceholder"),
  dropZone: document.querySelector("#dropZone"),
  imageError: document.querySelector("#imageError"),
  submissionNotice: document.querySelector("#submissionNotice"),
  toast: document.querySelector("#toast"),
};

function normalize(value = "") {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function yearFromLocation(location = "") {
  const match = location.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

function broadCategory(category = "") {
  if (category.includes("política")) return "Política";
  if (category.includes("mito")) return "Mito e memoria";
  if (category.includes("vida") || category.includes("sociedade") || category.includes("cultura")) return "Vida e sociedade";
  if (category.includes("antiga")) return "Lingua antiga";
  return "Léxico";
}

function imageUrl(item) {
  return `assets/images/${encodeURIComponent(item.file)}`;
}

function renderInline(container, value = "") {
  container.replaceChildren();
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    container.append(document.createTextNode(value.slice(cursor, match.index)));
    const token = match[0];
    if (token.startsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = token.slice(2, -2);
      container.append(strong);
    } else if (token.startsWith("*")) {
      const em = document.createElement("em");
      em.textContent = token.slice(1, -1);
      container.append(em);
    } else {
      const parts = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      const link = document.createElement("a");
      link.textContent = parts[1];
      link.href = parts[2];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      container.append(link);
    }
    cursor = match.index + token.length;
  }
  container.append(document.createTextNode(value.slice(cursor)));
}

function makeCard(item, index) {
  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.setAttribute("aria-label", `Abrir ficha: ${item.text}`);

  const imageWrap = document.createElement("span");
  imageWrap.className = "card-image";
  const image = document.createElement("img");
  image.src = imageUrl(item);
  image.alt = `Texto grego documentado en ${item.location}: ${item.text}`;
  image.loading = index < 6 ? "eager" : "lazy";
  image.decoding = "async";
  imageWrap.append(image);

  const title = document.createElement("span");
  title.className = "card-title";
  title.lang = "el";
  title.textContent = item.text;

  const meta = document.createElement("span");
  meta.className = "card-meta";
  const location = document.createElement("span");
  location.textContent = item.location;
  const category = document.createElement("span");
  category.textContent = broadCategory(item.category);
  meta.append(location, category);

  card.append(imageWrap, title, meta);
  card.addEventListener("click", () => openRecord(index));
  return card;
}

function renderGallery() {
  els.gallery.replaceChildren();
  const fragment = document.createDocumentFragment();
  state.visible.forEach((item, index) => fragment.append(makeCard(item, index)));
  els.gallery.append(fragment);
  els.gallery.setAttribute("aria-busy", "false");
  els.empty.classList.toggle("hidden", state.visible.length !== 0);
  els.resultCount.textContent = state.visible.length === state.all.length
    ? `${state.all.length} pezas`
    : `${state.visible.length} de ${state.all.length} pezas`;
}

function applyFilters() {
  const query = normalize(els.search.value.trim());
  const category = els.category.value;
  let list = state.all.filter((item) => {
    const haystack = normalize([
      item.text, item.transcription, item.etymology, item.comment,
      item.location, item.category,
    ].join(" "));
    return (!query || haystack.includes(query))
      && (!category || broadCategory(item.category) === category);
  });

  if (els.sort.value === "newest") list.sort((a, b) => yearFromLocation(b.location) - yearFromLocation(a.location));
  if (els.sort.value === "oldest") list.sort((a, b) => yearFromLocation(a.location) - yearFromLocation(b.location));
  if (els.sort.value === "alpha") list.sort((a, b) => a.text.localeCompare(b.text, "el"));
  state.visible = list;
  renderGallery();
  renderFilterChips(query, category);
}

function renderFilterChips(query, category) {
  els.activeFilters.replaceChildren();
  if (query) els.activeFilters.append(makeChip(`Procura: “${els.search.value.trim()}”`, () => {
    els.search.value = "";
    applyFilters();
    els.search.focus();
  }));
  if (category) els.activeFilters.append(makeChip(category, () => {
    els.category.value = "";
    applyFilters();
  }));
}

function makeChip(label, onClick) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "filter-chip";
  chip.textContent = `${label} ×`;
  chip.addEventListener("click", onClick);
  return chip;
}

function openRecord(index) {
  state.currentIndex = index;
  const item = state.visible[index];
  if (!item) return;
  els.dialogImage.src = imageUrl(item);
  els.dialogImage.alt = `Texto grego documentado en ${item.location}: ${item.text}`;
  els.dialogTitle.textContent = item.text;
  els.dialogTranscription.textContent = item.transcription;
  els.dialogCategory.textContent = broadCategory(item.category);
  els.dialogLocation.textContent = item.location;
  renderInline(els.dialogEtymology, item.etymology);
  renderInline(els.dialogComment, item.comment);
  els.imagePosition.textContent = `${index + 1} / ${state.visible.length}`;
  els.imageDialog.showModal();
}

function navigateRecord(direction) {
  if (!state.visible.length) return;
  state.currentIndex = (state.currentIndex + direction + state.visible.length) % state.visible.length;
  const item = state.visible[state.currentIndex];
  els.dialogImage.src = imageUrl(item);
  els.dialogImage.alt = `Texto grego documentado en ${item.location}: ${item.text}`;
  els.dialogTitle.textContent = item.text;
  els.dialogTranscription.textContent = item.transcription;
  els.dialogCategory.textContent = broadCategory(item.category);
  els.dialogLocation.textContent = item.location;
  renderInline(els.dialogEtymology, item.etymology);
  renderInline(els.dialogComment, item.comment);
  els.imagePosition.textContent = `${state.currentIndex + 1} / ${state.visible.length}`;
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

function setTheme(theme) {
  const light = theme === "light";
  document.body.classList.toggle("light", light);
  const button = document.querySelector("#themeToggle");
  button.firstElementChild.textContent = light ? "☾" : "☼";
  button.setAttribute("aria-label", light ? "Activar modo escuro" : "Activar modo claro");
  document.querySelector('meta[name="theme-color"]').content = light ? "#f0eee5" : "#171712";
  localStorage.setItem("graphes-theme", theme);
}

function handleImage(file) {
  els.imageError.textContent = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    els.imageError.textContent = "O ficheiro debe ser unha imaxe.";
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    els.imageError.textContent = "A imaxe supera o máximo de 15 MB.";
    els.imageInput.value = "";
    return;
  }
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.imageFile = file;
  state.previewUrl = URL.createObjectURL(file);
  els.uploadPreview.src = state.previewUrl;
  els.uploadPreview.classList.remove("hidden");
  els.dropPlaceholder.classList.add("hidden");
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `graphes-${Date.now()}`;
}

async function prepareContribution(event) {
  event.preventDefault();
  els.submissionNotice.classList.add("hidden");
  if (!state.imageFile) {
    els.imageError.textContent = "Escolle unha imaxe para continuar.";
    els.dropZone.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!els.form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(els.form).entries());
  delete data.image;
  delete data.permission;
  const base = slugify(data.text);
  const extension = state.imageFile.name.split(".").pop().toLowerCase();
  const record = {
    id: base,
    file: `${base}.${extension}`,
    text: data.text.trim(),
    transcription: data.transcription.trim(),
    etymology: data.etymology.trim(),
    comment: data.comment.trim(),
    category: data.type,
    location: [data.place.trim(), data.year].filter(Boolean).join(", "),
    credit: data.credit.trim(),
    submittedAt: new Date().toISOString(),
  };
  const jsonFile = new File(
    [JSON.stringify(record, null, 2)],
    `${base}.json`,
    { type: "application/json" },
  );
  const renamedImage = new File([state.imageFile], `${base}.${extension}`, { type: state.imageFile.type });
  const shareData = {
    title: `Achega para Graphes: ${record.text}`,
    text: `Nova proposta para o arquivo Graphes\n${record.text}\n${record.location}`,
    files: [renamedImage, jsonFile],
  };

  try {
    if (navigator.canShare?.({ files: shareData.files })) {
      await navigator.share(shareData);
      showToast("Achega preparada para enviar");
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
  }

  downloadBlob(jsonFile, jsonFile.name);
  const issueBody = [
    "## Nova achega",
    `**Texto:** ${record.text}`,
    `**Transcrición:** ${record.transcription || "—"}`,
    `**Lugar e data:** ${record.location}`,
    `**Tipo:** ${record.category}`,
    `**Contexto:** ${record.comment || "—"}`,
    `**Relación co grego antigo:** ${record.etymology || "—"}`,
    `**Crédito:** ${record.credit || "Anónimo"}`,
    "",
    "> Adxunta a imaxe a esta proposta antes de enviala.",
  ].join("\n");
  const issueUrl = `https://github.com/moronbandin/graphes/issues/new?title=${encodeURIComponent(`Nova voz: ${record.text.slice(0, 60)}`)}&body=${encodeURIComponent(issueBody)}`;

  els.submissionNotice.replaceChildren();
  const text = document.createElement("span");
  text.textContent = "Descargamos a ficha da achega. Agora ";
  const link = document.createElement("a");
  link.href = issueUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "abre a proposta en GitHub e adxunta a foto";
  const end = document.createTextNode(". A imaxe non sae do teu dispositivo ata que ti a envías.");
  els.submissionNotice.append(text, link, end);
  els.submissionNotice.classList.remove("hidden");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  setTimeout(() => els.toast.classList.remove("visible"), 2400);
}

async function loadGallery() {
  try {
    const response = await fetch("data/gallery.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.all = data;
    state.visible = [...data];
    els.totalCount.textContent = data.length;

    const categories = [...new Set(data.map((item) => broadCategory(item.category)))].sort();
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      els.category.append(option);
    });
    applyFilters();
  } catch (error) {
    console.error("Non se puido cargar a colección:", error);
    els.gallery.classList.add("hidden");
    els.resultCount.textContent = "";
    els.error.classList.remove("hidden");
  }
}

els.search.addEventListener("input", applyFilters);
els.category.addEventListener("change", applyFilters);
els.sort.addEventListener("change", applyFilters);
document.querySelector("#clearFilters").addEventListener("click", () => {
  els.search.value = "";
  els.category.value = "";
  els.sort.value = "curated";
  applyFilters();
});

document.querySelector("#prevBtn").addEventListener("click", () => navigateRecord(-1));
document.querySelector("#nextBtn").addEventListener("click", () => navigateRecord(1));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", closeOnBackdrop));
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
document.querySelectorAll("[data-open-about]").forEach((button) => {
  button.addEventListener("click", () => els.aboutDialog.showModal());
});
document.querySelectorAll("[data-open-contribute]").forEach((button) => {
  button.addEventListener("click", () => els.contributeDialog.showModal());
});

document.addEventListener("keydown", (event) => {
  if (!els.imageDialog.open) return;
  if (event.key === "ArrowLeft") navigateRecord(-1);
  if (event.key === "ArrowRight") navigateRecord(1);
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  setTheme(document.body.classList.contains("light") ? "dark" : "light");
});

els.imageInput.addEventListener("change", () => handleImage(els.imageInput.files[0]));
["dragenter", "dragover"].forEach((name) => els.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  els.dropZone.classList.add("dragging");
}));
["dragleave", "drop"].forEach((name) => els.dropZone.addEventListener(name, (event) => {
  event.preventDefault();
  els.dropZone.classList.remove("dragging");
}));
els.dropZone.addEventListener("drop", (event) => handleImage(event.dataTransfer.files[0]));
els.form.addEventListener("submit", prepareContribution);

document.querySelector("#currentYear").textContent = new Date().getFullYear();
setTheme(localStorage.getItem("graphes-theme")
  || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
loadGallery();
