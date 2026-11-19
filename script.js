/* =========================================
   SHIKKHASETU - FRONTEND JAVASCRIPT
========================================= */

// এখানে নিজের Google Apps Script Web App URL বসাবে
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

let allTutors = [];

// HTML element
const tutorGrid = document.getElementById("tutorGrid");
const resultCount = document.getElementById("resultCount");
const subjectFilter = document.getElementById("subjectFilter");
const districtFilter = document.getElementById("districtFilter");
const keywordFilter = document.getElementById("keywordFilter");

// Mobile menu
document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("navMenu").classList.toggle("show");
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("navMenu").classList.remove("show");
  });
});

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Google Apps Script থেকে JSONP দিয়ে তথ্য আনা
function loadTutors() {
  if (
    !GOOGLE_SCRIPT_URL ||
    GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")
  ) {
    showError("script.js ফাইলে Google Apps Script URL বসানো হয়নি।");
    return;
  }

  tutorGrid.innerHTML = '<div class="loading">শিক্ষকদের তথ্য লোড হচ্ছে...</div>';

  const callbackName = "shikkhaCallback_" + Date.now();

  window[callbackName] = function(response) {
    delete window[callbackName];

    if (response && response.success && Array.isArray(response.data)) {
      allTutors = response.data;
      displayTutors(allTutors);
    } else {
      showError(
        response && response.message
          ? response.message
          : "তথ্য পাওয়া যায়নি। পরে আবার চেষ্টা করুন।"
      );
    }
  };

  const script = document.createElement("script");

  script.src =
    GOOGLE_SCRIPT_URL +
    "?action=getTutors&callback=" +
    encodeURIComponent(callbackName);

  script.onerror = function() {
    delete window[callbackName];
    showError("সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না। URL ও Deployment পরীক্ষা করো।");
    script.remove();
  };

  script.onload = function() {
    script.remove();
  };

  document.body.appendChild(script);

  // সার্ভার থেকে উত্তর না এলে timeout
  setTimeout(() => {
    if (window[callbackName]) {
      delete window[callbackName];
      script.remove();
      showError("সার্ভার থেকে উত্তর আসেনি। আবার চেষ্টা করো।");
    }
  }, 20000);
}

// নিরাপদ HTML text
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// ফোন নম্বর থেকে WhatsApp link তৈরি
function makeWhatsAppLink(phone) {
  let number = String(phone || "").replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = "88" + number;
  }

  if (number.length < 10) {
    return "";
  }

  return "https://wa.me/" + number;
}

// Tutor card তৈরি
function createTutorCard(tutor) {
  const name = escapeHTML(tutor.Name || "নাম দেওয়া হয়নি");
  const subject = escapeHTML(tutor.Subject || "বিষয় উল্লেখ নেই");
  const district = escapeHTML(tutor.District || "জেলা উল্লেখ নেই");
  const area = escapeHTML(tutor.Area || "এলাকা উল্লেখ নেই");
  const university = escapeHTML(tutor.University || "উল্লেখ নেই");
  const department = escapeHTML(tutor.Department || "উল্লেখ নেই");
  const experience = escapeHTML(tutor.Experience || "উল্লেখ নেই");
  const bio = escapeHTML(tutor.Bio || "");
  const fee = escapeHTML(tutor.Fee || "আলোচনা সাপেক্ষে");

  const photo = tutor.Photo
    ? escapeHTML(tutor.Photo)
    : "https://placehold.co/150x150/eaf7f1/087c59?text=Tutor";

  const whatsappLink = makeWhatsAppLink(tutor.Phone);

  const contactButton = whatsappLink
    ? `<a class="tutor-contact" href="${whatsappLink}" target="_blank" rel="noopener noreferrer">WhatsApp-এ যোগাযোগ →</a>`
    : `<span class="tutor-contact">যোগাযোগের নম্বর নেই</span>`;

  return `
    <article class="tutor-card">
      <div class="tutor-top">
        <img
          class="tutor-photo"
          src="${photo}"
          alt="${name}"
          loading="lazy"
          onerror="this.src='https://placehold.co/150x150/eaf7f1/087c59?text=Tutor'"
        >
        <div>
          <h3>${name}</h3>
          <p>${subject}</p>
        </div>
      </div>

      <div class="tutor-details">
        <p>📍 ${district}, ${area}</p>
        <p>🎓 ${university}</p>
        <p>📖 বিভাগ: ${department}</p>
        <p>⭐ অভিজ্ঞতা: ${experience}</p>
        ${bio ? `<p>${bio}</p>` : ""}
      </div>

      <div class="tutor-fee">৳ ${fee}</div>
      ${contactButton}
    </article>
  `;
}

// Tutor list দেখানো
function displayTutors(tutors) {
  resultCount.textContent = "মোট " + tutors.length + " জন শিক্ষক পাওয়া গেছে";

  if (!tutors.length) {
    tutorGrid.innerHTML =
      '<div class="empty-message">কোনো শিক্ষক পাওয়া যায়নি। অন্যভাবে সার্চ করে দেখুন।</div>';
    return;
  }

  tutorGrid.innerHTML = tutors.map(createTutorCard).join("");
}

// Search
function searchTutors() {
  const subject = subjectFilter.value.trim().toLowerCase();
  const district = districtFilter.value.trim().toLowerCase();
  const keyword = keywordFilter.value.trim().toLowerCase();

  const filtered = allTutors.filter(tutor => {
    const tutorSubject = String(tutor.Subject || "").toLowerCase();
    const tutorDistrict = String(tutor.District || "").toLowerCase();

    const searchableText = [
      tutor.Name,
      tutor.Subject,
      tutor.District,
      tutor.Area,
      tutor.University,
      tutor.Department,
      tutor.Bio
    ].join(" ").toLowerCase();

    const subjectMatch = !subject || tutorSubject.includes(subject);
    const districtMatch = !district || tutorDistrict.includes(district);
    const keywordMatch = !keyword || searchableText.includes(keyword);

    return subjectMatch && districtMatch && keywordMatch;
  });

  displayTutors(filtered);
}

// Search button
document.getElementById("searchBtn").addEventListener("click", searchTutors);

// Enter চাপলেও Search হবে
keywordFilter.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    searchTutors();
  }
});

// Filter clear
document.getElementById("clearBtn").addEventListener("click", () => {
  subjectFilter.value = "";
  districtFilter.value = "";
  keywordFilter.value = "";
  displayTutors(allTutors);
});

// Error message
function showError(message) {
  resultCount.textContent = "তথ্য লোড করা যায়নি";

  tutorGrid.innerHTML = `
    <div class="error-message">
      ${escapeHTML(message)}
      <br><br>
      <button class="btn btn-primary" onclick="loadTutors()">আবার চেষ্টা করুন</button>
    </div>
  `;
}

// Website চালু হলে
loadTutors();