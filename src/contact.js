// @ts-check

/**
 * Initializes the Netlify inline contact form and the lazy-loaded Google Calendar booking accordion.
 */
export function initContact() {
  initContactForm();
  initCalendarAccordion();
}

/**
 * Attaches the Netlify Forms AJAX submission handler to `#contactForm`.
 * Preserves honeypot (`bot-field`), `form-name="contact"`, `role="alert"` status feedback,
 * and local development server fallback (`localhost` / `127.0.0.1` / `file:`).
 */
function initContactForm() {
  const form = /** @type {HTMLFormElement | null} */ (
    document.getElementById("contactForm")
  );
  if (!form) return;

  const submitBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("submitBtn")
  );
  const btnText = submitBtn
    ? submitBtn.querySelector(".submit-btn-text")
    : null;
  const statusDiv = /** @type {HTMLElement | null} */ (
    document.getElementById("formStatusMessage")
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = "Sending...";
    if (statusDiv) {
      statusDiv.hidden = true;
      statusDiv.className = "form-status";
      statusDiv.textContent = "";
    }

    const formData = new FormData(form);
    const urlEncodedPairs = /** @type {Record<string, string>} */ ({});
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        urlEncodedPairs[key] = value;
      }
    });

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(urlEncodedPairs).toString(),
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
          statusDiv.hidden = false;
        }
        form.reset();
      } else {
        throw new Error(`Form submission failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Netlify Form submission error:", err);
      if (statusDiv) {
        statusDiv.className = "form-status status-error";
        statusDiv.innerHTML =
          'Oops! There was a problem sending your message. Please try again or reach out at <a href="mailto:tarik.sorguc1@gmail.com">tarik.sorguc1@gmail.com</a>.';
        statusDiv.hidden = false;
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = "Send Message";
    }
  });
}

/**
 * Initializes the "Book a Meeting" collapsible accordion and sets the Google Calendar
 * iframe `src` only on the first open (lazy-loading).
 */
function initCalendarAccordion() {
  const card = document.getElementById("calendar-booking");
  const accordionBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("calendarAccordionBtn")
  );
  const bookMeetingCta = document.getElementById("bookMeetingBtn");
  const badgeText = document.getElementById("calendarToggleText");
  const iframe = /** @type {HTMLIFrameElement | null} */ (
    document.getElementById("calendarIframe")
  );

  if (!card || !accordionBtn) return;

  /**
   * Toggles or forces the open state of the calendar accordion.
   * @param {boolean} [forceOpen]
   * @param {boolean} [scrollIntoView=false]
   */
  function setCalendarOpen(forceOpen, scrollIntoView = false) {
    if (!card || !accordionBtn) return;
    const isOpen = card.classList.contains("open");
    const nextOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    card.classList.toggle("open", nextOpen);
    accordionBtn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
    if (badgeText) {
      badgeText.textContent = nextOpen ? "Hide Calendar" : "Show Calendar";
    }

    // Lazy-load the Google Calendar iframe only the first time it opens
    if (nextOpen && iframe && !iframe.getAttribute("src")) {
      const dataSrc = iframe.getAttribute("data-src");
      if (dataSrc) {
        iframe.setAttribute("src", dataSrc);
      }
    }

    if (nextOpen && scrollIntoView) {
      const prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => {
        card.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }

  accordionBtn.addEventListener("click", () => {
    setCalendarOpen(undefined, true);
  });

  if (bookMeetingCta) {
    bookMeetingCta.addEventListener("click", (e) => {
      e.preventDefault();
      setCalendarOpen(true, true);
    });
  }
}
