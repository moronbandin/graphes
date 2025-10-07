// === GALERÍA DIXITAL GRAPHES ===

const galleryContainer = document.getElementById("gallery");
const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeBtn = document.querySelector(".close");
const infoButton = document.getElementById("infoButton");
const infoPanel = document.getElementById("infoPanel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let images = [];
let currentIndex = 0;


function parseMarkdown(md) {
  return md
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank'>$1</a>");
}


// --- CARGA DO JSON ---
fetch("data/gallery.json")
  .then((response) => response.json())
  .then((data) => {
    images = data.sort(() => Math.random() - 0.5); // orde aleatoria
    renderGallery(images);
  })


// --- CREACIÓN DAS TARXETAS ---
function renderGallery(data) {
  data.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `<img src="assets/images/${item.file}" alt="${item.id}">`;
    card.addEventListener("click", () => openModal(index));
    galleryContainer.appendChild(card);
  });
}

// --- ABRIR MODAL ---
function openModal(index) {
  currentIndex = index;
  const item = images[index];
  modalImage.src = `assets/images/${item.file}`;
  modal.classList.remove("hidden");
  infoButton.classList.remove("hidden");
  infoPanel.classList.add("hidden");
  infoButton.textContent = "";
  document.body.style.overflow = "hidden"; // evitar scroll de fondo
}

// --- PECHAR MODAL ---
closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
function closeModal() {
  modal.classList.add("hidden");
  infoButton.classList.add("hidden");
  document.body.style.overflow = "";
}

// --- NAVEGACIÓN CON FRECHAS ---
prevBtn.addEventListener("click", () => navigate(-1));
nextBtn.addEventListener("click", () => navigate(1));

function navigate(direction) {
  currentIndex = (currentIndex + direction + images.length) % images.length;
  openModal(currentIndex);
}

// --- INFO PANEL ---
infoButton.addEventListener("click", () => {
  if (infoPanel.classList.contains("hidden")) {
    showInfo(currentIndex);
  } else {
    infoPanel.classList.add("hidden");
    infoButton.textContent = "";
  }
});

function showInfo(index) {
  const item = images[index];
  infoPanel.innerHTML = `
    <h2>${item.text}</h2>
    <p><strong>Transcrición:</strong> ${item.transcription}</p>
    <p><strong>Etimoloxía:</strong> ${parseMarkdown(item.etymology)}</p>
    <p><strong>Comentario:</strong> ${parseMarkdown(item.comment)}</p>
    <p><em>${item.category}</em> · ${item.location}</p>
  `;

  // 👇 forza Safari a repintar antes de facelo visible
  infoPanel.style.display = "block";
  void infoPanel.offsetHeight;
  infoPanel.classList.remove("hidden");
  infoButton.textContent = "✕";
}

// Forza Safari a repintar a capa
setTimeout(() => {
  infoPanel.style.webkitTransform = "translateZ(0)";
}, 10);

// --- NAVEGACIÓN CON TECLADO ---
document.addEventListener("keydown", (e) => {
  if (modal.classList.contains("hidden")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") navigate(1);
  if (e.key === "ArrowLeft") navigate(-1);
});

// --- SUAVIZAR APARICIÓN ---
modal.addEventListener("transitionend", () => {
  modalImage.classList.toggle("fade-in");
});
