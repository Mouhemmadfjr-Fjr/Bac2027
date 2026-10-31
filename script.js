document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());

const resourceLabels = {
  "physics-questions": "بنوك أسئلة الفيزياء",
  "physics-summaries": "نوط وملخصات الفيزياء",
  "physics-exams": "نماذج امتحانية للفيزياء",
  "chemistry-questions": "بنوك أسئلة الكيمياء",
  "chemistry-summaries": "نوط وملخصات الكيمياء",
  "chemistry-exams": "نماذج امتحانية للكيمياء",
};

let resourceManifest = {};

function resourceFileMarkup(files) {
  const list = document.createElement("div");
  list.className = "resource-file-list";

  files.forEach((file, index) => {
    const link = document.createElement("a");
    link.className = "resource-file";
    link.href = file.path;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong></strong><b>فتح الملف ↗</b>`;
    link.querySelector("strong").textContent = file.name;
    list.append(link);
  });
  return list;
}

function restoreScrollPosition(scrollX, scrollY) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(scrollX, scrollY);
  root.style.scrollBehavior = previousBehavior;
}

function showDialogWithoutMovingPage(dialog) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  try {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  } catch (error) {
    dialog.setAttribute("open", "");
    console.warn("تعذر فتح النافذة المنبثقة بالطريقة الأصلية، تم استخدام الوضع البديل.", error);
  }
  restoreScrollPosition(scrollX, scrollY);
  requestAnimationFrame(() => restoreScrollPosition(scrollX, scrollY));
}

function closeDialogWithoutMovingPage(dialog) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  if (typeof dialog.close === "function" && dialog.open) dialog.close();
  else dialog.removeAttribute("open");
  restoreScrollPosition(scrollX, scrollY);
  requestAnimationFrame(() => restoreScrollPosition(scrollX, scrollY));
}

async function loadResourceFiles() {
  const embeddedManifest = document.querySelector("#resource-manifest");
  if (window.location.protocol === "file:" && embeddedManifest) {
    try {
      resourceManifest = JSON.parse(embeddedManifest.textContent || "{}");
    } catch {
      resourceManifest = {};
    }
    return;
  }

  try {
    const response = await fetch("files/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    resourceManifest = await response.json();
  } catch {
    resourceManifest = {};
  }
}

document.querySelectorAll("[data-resource-section]").forEach((resource) => {
  resource.addEventListener("click", () => {
    const sectionId = resource.dataset.resourceSection;
    const filesDialog = document.querySelector("[data-files-dialog]");
    const filesTitle = document.querySelector("[data-files-title]");
    const filesBody = document.querySelector("[data-files-dialog-body]");
    if (!filesDialog || !filesTitle || !filesBody) return;

    const files = Array.isArray(resourceManifest[sectionId]) ? resourceManifest[sectionId] : [];
    filesTitle.textContent = resourceLabels[sectionId] || "الملفات";
    filesBody.replaceChildren();
    if (files.length === 0) {
      const empty = document.createElement("p");
      empty.className = "resource-files-error";
      empty.textContent = "لا توجد ملفات في هذا القسم حالياً.";
      filesBody.append(empty);
    } else {
      const count = document.createElement("p");
      count.className = "files-dialog-count";
      count.textContent = `${files.length} ملف`;
      filesBody.append(count, resourceFileMarkup(files));
    }

    showDialogWithoutMovingPage(filesDialog);
  });
});

loadResourceFiles();

const aboutDialog = document.querySelector("[data-about-dialog]");
const aboutLinks = document.querySelectorAll("[data-about-link]");
const aboutClose = document.querySelector("[data-about-close]");
const filesDialog = document.querySelector("[data-files-dialog]");
const filesClose = document.querySelector("[data-files-close]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const siteMenu = document.querySelector("[data-site-menu]");

aboutLinks.forEach((aboutLink) => aboutLink.addEventListener("click", (event) => {
  event.preventDefault();
  siteMenu?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  if (!aboutDialog) return;
  showDialogWithoutMovingPage(aboutDialog);
}));

menuToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = siteMenu?.classList.toggle("is-open") ?? false;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteMenu?.querySelectorAll("[data-menu-link]").forEach((link) => {
  link.addEventListener("click", () => {
    siteMenu.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  if (siteMenu?.classList.contains("is-open") && !siteMenu.contains(event.target) && event.target !== menuToggle) {
    siteMenu.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
});

aboutClose?.addEventListener("click", () => {
  if (!aboutDialog) return;
  closeDialogWithoutMovingPage(aboutDialog);
});

filesClose?.addEventListener("click", () => {
  if (!filesDialog) return;
  closeDialogWithoutMovingPage(filesDialog);
});

[aboutDialog, filesDialog].forEach((dialog) => {
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialogWithoutMovingPage(dialog);
  });
});
