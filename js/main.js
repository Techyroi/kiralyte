// =========================================================
// KIRALYTE - MAIN JAVASCRIPT
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     MOBILE NAVIGATION
     ======================================================= */

  const navToggle = document.querySelector(".nav__toggle");
  const navMenu = document.querySelector(".nav__menu");

  if (navToggle && navMenu) {

    navToggle.addEventListener("click", () => {

      const isOpen = navMenu.classList.toggle("is-open");

      navToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );

    });


    // Close menu when navigation link is clicked

    navMenu.querySelectorAll("a").forEach((link) => {

      link.addEventListener("click", () => {

        navMenu.classList.remove("is-open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        navToggle.setAttribute(
          "aria-label",
          "Open navigation"
        );

      });

    });


    // Close menu when clicking outside

    document.addEventListener("click", (event) => {

      if (
        navMenu.classList.contains("is-open") &&
        !navMenu.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {

        navMenu.classList.remove("is-open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        navToggle.setAttribute(
          "aria-label",
          "Open navigation"
        );

      }

    });


    // Close mobile menu when resizing to desktop

    window.addEventListener("resize", () => {

      if (window.innerWidth > 900) {

        navMenu.classList.remove("is-open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        navToggle.setAttribute(
          "aria-label",
          "Open navigation"
        );

      }

    });

  }


  /* =======================================================
     CONTACT FORM
     ======================================================= */

  const contactForm = document.querySelector(".contact__form");

  if (contactForm) {

    contactForm.addEventListener("submit", (event) => {

      event.preventDefault();

      const button = contactForm.querySelector(
        ".btn--submit"
      );

      if (!button) return;

      const originalText = button.innerHTML;

      button.innerHTML = "Message Ready ✓";

      button.disabled = true;

      setTimeout(() => {

        button.innerHTML = originalText;

        button.disabled = false;

      }, 2500);

    });

  }


  /* =======================================================
     SMOOTH SCROLL
     ======================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {

    link.addEventListener("click", (event) => {

      const targetId = link.getAttribute("href");

      if (
        !targetId ||
        targetId === "#" ||
        targetId.length <= 1
      ) {
        return;
      }

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    });

  });

});