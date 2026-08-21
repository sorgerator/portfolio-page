// Contact Modal
function openContactModal() {
  const modal = document.getElementById("contact-modal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => {
    const nameInput = document.getElementById("contact-name");
    if (nameInput) nameInput.focus();
  }, 100);
}

function closeContactModal() {
  const modal = document.getElementById("contact-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  const triggerBtn = document.getElementById("contactModalBtn");
  if (triggerBtn) triggerBtn.focus();
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeContactModal();
  }
});

// Netlify Contact Form Submission
async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn
    ? submitBtn.querySelector(".submit-btn-text")
    : null;
  const statusDiv = document.getElementById("formStatusMessage");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (btnText) btnText.textContent = "Sending...";
  if (statusDiv) {
    statusDiv.style.display = "none";
    statusDiv.className = "form-status";
    statusDiv.textContent = "";
  }

  const formData = new FormData(form);

  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.protocol === "file:";

    if (
      response.ok ||
      (isLocal && (response.status === 404 || response.status === 405))
    ) {
      if (statusDiv) {
        statusDiv.className = "form-status status-success";
        statusDiv.textContent = isLocal
          ? "Form test successful! (On Netlify, this will submit directly to Netlify Forms)"
          : "Thank you! Your message has been sent successfully.";
        statusDiv.style.display = "block";
      }
      form.reset();

      setTimeout(() => {
        closeContactModal();
        if (statusDiv) statusDiv.style.display = "none";
      }, 2500);
    } else {
      throw new Error(
        "Form submission failed with status " + response.status,
      );
    }
  } catch (err) {
    console.error("Netlify Form submission error:", err);
    if (statusDiv) {
      statusDiv.className = "form-status status-error";
      statusDiv.innerHTML =
        'Oops! There was a problem sending your message. Please try again or reach out at <a href="mailto:tarik.sorguc1@gmail.com">tarik.sorguc1@gmail.com</a>.';
      statusDiv.style.display = "block";
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = "Send Message";
  }
}

// Google Calendar Toggle
function toggleCalendar(e) {
  if (e) {
    e.preventDefault();
  }
  const card = document.getElementById("calendar-booking");
  const badgeText = document.getElementById("calendarToggleText");
  const header = document.querySelector(".calendar-card-header");

  if (!card) return;

  const isOpen = card.classList.contains("open");

  if (isOpen) {
    card.classList.remove("open");
    if (badgeText) badgeText.textContent = "Show Calendar";
    if (header) header.setAttribute("aria-expanded", "false");
  } else {
    card.classList.add("open");
    if (badgeText) badgeText.textContent = "Hide Calendar";
    if (header) header.setAttribute("aria-expanded", "true");
    setTimeout(() => {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }
}

// Mobile Navigation Toggle
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

function toggleNavMenu(forceState) {
  if (!navToggle || !navLinks) return;
  const shouldOpen =
    forceState !== undefined
      ? forceState
      : !navLinks.classList.contains("open");
  navToggle.classList.toggle("open", shouldOpen);
  navLinks.classList.toggle("open", shouldOpen);
  navToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
}

if (navToggle) {
  navToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleNavMenu();
  });
}

// Close menu when any link inside navLinks is clicked
if (navLinks) {
  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggleNavMenu(false);
    });
  });
}

// Close menu when clicking outside navbar
document.addEventListener("click", function (e) {
  if (navLinks && navLinks.classList.contains("open")) {
    const navbar = document.getElementById("navbar");
    if (navbar && !navbar.contains(e.target)) {
      toggleNavMenu(false);
    }
  }
});

// Close mobile dropdown when resizing beyond Mobile L (425px)
window.addEventListener("resize", function () {
  if (
    window.innerWidth > 425 &&
    navLinks &&
    navLinks.classList.contains("open")
  ) {
    toggleNavMenu(false);
  }
});
