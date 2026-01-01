/* ================= FIREBASE IMPORTS ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDimPLQ6SlmlG_WO8vaxZw9RbB-VS9R6z0",
  authDomain: "global-lost-and-found.firebaseapp.com",
  projectId: "global-lost-and-found"
};
function getPlaceholderImage(title) {
  if (!title) return PLACEHOLDERS.default;

  const key = title.toLowerCase();

  for (const type in PLACEHOLDERS) {
    if (key.includes(type)) return PLACEHOLDERS[type];
  }

  return PLACEHOLDERS.default;
}


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const PLACEHOLDERS = {
  wallet: "https://cdn-icons-png.flaticon.com/512/3523/3523887.png",
  phone: "https://cdn-icons-png.flaticon.com/512/597/597177.png",
  laptop: "https://cdn-icons-png.flaticon.com/512/2920/2920244.png",
  bag: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
  keys: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png",
  person: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  default: "https://cdn-icons-png.flaticon.com/512/679/679720.png"
};

/* ================= AUTH (SAFE) ================= */
let userId = "guest";

try {
  await signInAnonymously(auth);
  userId = auth.currentUser.uid;
  console.log("Auth OK:", userId);
} catch (err) {
  console.warn("Auth skipped (local dev):", err.message);
}

/* ================= DOM ================= */
const foundSection = document.getElementById("foundSection");
const lostSection = document.getElementById("lostSection");
const foundTab = document.getElementById("foundTab");
const lostTab = document.getElementById("lostTab");
const foundModal = document.getElementById("foundModal");
const lostModal = document.getElementById("lostModal");
const foundList = document.getElementById("foundList");
const lostList = document.getElementById("lostList");

const chatModal = document.getElementById("chatModal");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

/* ================= STATE ================= */
let foundCache = [];
let lostCache = [];
let currentChatItemId = null;

/* ================= TABS ================= */
window.showFound = () => {
  foundSection.classList.remove("hidden");
  lostSection.classList.add("hidden");

  foundTab.classList.add("bg-blue-600", "text-white");
  lostTab.classList.remove("bg-blue-600", "text-white");
};

window.showLost = () => {
  lostSection.classList.remove("hidden");
  foundSection.classList.add("hidden");

  lostTab.classList.add("bg-blue-600", "text-white");
  foundTab.classList.remove("bg-blue-600", "text-white");
};

/* ================= MODALS ================= */
window.openFoundForm = () => foundModal.classList.remove("hidden");
window.openLostForm = () => lostModal.classList.remove("hidden");
window.closeModals = () => {
  foundModal.classList.add("hidden");
  lostModal.classList.add("hidden");
};

/* ================= SUBMIT FOUND ================= */
window.submitFound = async () => {
  const imageFile = document.getElementById("f_image").files[0];
  const base64Image = await fileToBase64(imageFile);

  await addDoc(collection(db, "found_items"), {
    itemType: f_type.value,
    color: f_color.value,
    foundLocation: f_location.value,
    dateFound: f_date.value,
    image: base64Image, // ✅ BASE64 STORED
    contact: f_contact.value,
    createdAt: serverTimestamp()
  });

  closeModals();
  loadFoundItems();
};




function isValidImageURL(url) {
  return /\.(jpg|jpeg|png|webp)$/i.test(url);
}
function getPlaceholder(title) {
  if (!title) return PLACEHOLDERS.default;

  const t = title.toLowerCase();
  for (const key in PLACEHOLDERS) {
    if (t.includes(key)) return PLACEHOLDERS[key];
  }
  return PLACEHOLDERS.default;
}

function previewImage(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) {
      preview.classList.add("hidden");
      preview.src = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}


/* ================= SUBMIT LOST ================= */
window.submitLost = async () => {
  const imageFile = document.getElementById("l_image").files[0];
  const base64Image = await fileToBase64(imageFile);

  await addDoc(collection(db, "lost_items"), {
    itemName: l_name.value,
    description: l_desc.value,
    lastSeenLocation: l_location.value,
    dateLost: l_date.value,
    image: base64Image, // ✅ BASE64 STORED
    contact: l_contact.value,
    createdAt: serverTimestamp()
  });

  closeModals();
  loadLostItems();
};


/* ================= LOAD DATA ================= */
async function loadFoundItems() {
  const q = query(collection(db, "found_items"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  foundCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderFound(foundCache);
}
previewImage("f_image", "f_preview");
previewImage("l_image", "l_preview");


async function generateImage(itemName) {
  const res = await fetch(
    "https://YOUR_FUNCTION_URL/generateItemImage",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemName })
    }
  );

  const data = await res.json();

  return data.imageBase64
    ? `data:image/png;base64,${data.imageBase64}`
    : "";
}

async function loadLostItems() {
  const q = query(collection(db, "lost_items"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  lostCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderLost(lostCache);
}

/* ================= RENDER ================= */
function renderFound(items) {
  foundList.innerHTML = "";
  items.forEach(d => foundList.innerHTML += cardHTML(d, "found"));
}

function renderLost(items) {
  lostList.innerHTML = "";
  items.forEach(d => lostList.innerHTML += cardHTML(d, "lost"));
}

function cardHTML(item) {
  const wa = item.contact ? item.contact.replace(/\D/g, "") : "";

  // Clean item name for placeholder
  const label = encodeURIComponent(item.itemType || item.itemName || "item");

  // Placeholder image (no API, no billing)
  const imageSrc = item.image && item.image.trim() !== ""
    ? item.image
    : `https://placehold.co/600x400?text=${label}`;

  return `
  <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden flex flex-col">

    <!-- IMAGE -->
    <div class="h-48 w-full bg-slate-100">
      <img
        src="${imageSrc}"
        alt="${label}"
        class="h-full w-full object-cover"
        onerror="this.src='https://placehold.co/600x400?text=Item';"
      />
    </div>

    <!-- CONTENT -->
    <div class="p-4 flex flex-col flex-1">
      <h3 class="text-lg font-semibold capitalize mb-1">
        ${item.itemType || item.itemName}
      </h3>

      <div class="text-sm text-slate-600 space-y-1 mb-4">
        <p>📍 ${item.foundLocation || item.lastSeenLocation || "Not specified"}</p>
        <p>📅 ${item.dateFound || item.dateLost || "Not specified"}</p>
      </div>

      <!-- ACTIONS -->
      <div class="mt-auto flex gap-2">
        <button
          onclick="openChat('${item.id}')"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full">
          💬 Chat
        </button>

        ${wa ? `
          <a href="https://wa.me/${wa}" target="_blank"
            class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-full text-center">
            WhatsApp
          </a>
        ` : ""}
      </div>
    </div>
  </div>
  `;
}

/* ================= CHAT ================= */
window.openChat = (itemId) => {
  currentChatItemId = itemId;
  chatModal.classList.remove("hidden");
  loadMessages();
};

window.closeChat = () => {
  chatModal.classList.add("hidden");
  chatMessages.innerHTML = "";
};

window.sendMessage = async () => {
  const text = chatInput.value.trim();
  if (!text || !currentChatItemId) return;

  await addDoc(collection(db, "chats", currentChatItemId, "messages"), {
    text,
    sender: userId,
    createdAt: serverTimestamp()
  });

  chatInput.value = "";
};

function loadMessages() {
  const q = query(
    collection(db, "chats", currentChatItemId, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, snap => {
    chatMessages.innerHTML = "";
    snap.forEach(doc => {
      const d = doc.data();
      const div = document.createElement("div");
      div.className = d.sender === userId
        ? "self-end bg-blue-600 text-white px-4 py-2 rounded-2xl"
        : "self-start bg-slate-200 px-4 py-2 rounded-2xl";
      div.textContent = d.text;
      chatMessages.appendChild(div);
    });
  });
}

/* ================= INIT ================= */
loadFoundItems();
loadLostItems();
