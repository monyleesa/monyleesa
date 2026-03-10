/* ================================
   Monyleesa — Global Scripts (main.js)
   - Mobile navigation (accessible)
   - Testimonials carousel (accessible-ish, lightweight)
   - Footer year
   - Contact preview form validation messaging (client-side)
   ================================= */

(function () {
  "use strict";

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -------- Footer year --------
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // -------- Mobile nav --------
  const toggle = qs("[data-nav-toggle]");
  const menu = qs("[data-nav-menu]");

  function setNav(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("is-open", open);

    // Update SR label
    const sr = qs(".sr-only", toggle);
    if (sr) sr.textContent = open ? "Close menu" : "Open menu";
  }

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setNav(!isOpen);
    });

    // Close on outside click (mobile)
    document.addEventListener("click", (e) => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (menu.contains(target) || toggle.contains(target)) return;
      setNav(false);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      if (e.key === "Escape") setNav(false);
    });

    // Close after selecting a link (mobile)
    qsa(".site-nav__link", menu).forEach((link) => {
      link.addEventListener("click", () => setNav(false));
    });
  }

  // -------- Testimonials carousel --------
  const carousel = qs("[data-carousel]");
  if (carousel) {
    const track = qs("[data-carousel-track]", carousel);
    const slides = qsa("[data-carousel-slide]", carousel);
    const prevBtn = qs("[data-carousel-prev]", carousel);
    const nextBtn = qs("[data-carousel-next]", carousel);
    const dotsWrap = qs("[data-carousel-dots]", carousel);

    let index = 0;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clamp(i) {
      const max = slides.length - 1;
      if (i < 0) return max;
      if (i > max) return 0;
      return i;
    }

    function scrollToIndex(i) {
      if (!track || slides.length === 0) return;
      index = clamp(i);

      const slide = slides[index];
      const left = slide.offsetLeft;

      track.scrollTo({
        left,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      // aria-current dots
      if (dotsWrap) {
        qsa("button.dot", dotsWrap).forEach((b, idx) => {
          b.setAttribute("aria-current", idx === index ? "true" : "false");
        });
      }
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dot";
        btn.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
        btn.setAttribute("aria-current", i === 0 ? "true" : "false");
        btn.addEventListener("click", () => scrollToIndex(i));
        dotsWrap.appendChild(btn);
      });
    }

    if (slides.length > 1) {
      buildDots();

      if (prevBtn) prevBtn.addEventListener("click", () => scrollToIndex(index - 1));
      if (nextBtn) nextBtn.addEventListener("click", () => scrollToIndex(index + 1));

      // Keyboard support on track
      if (track) {
        track.addEventListener("keydown", (e) => {
          if (e.key === "ArrowLeft") scrollToIndex(index - 1);
          if (e.key === "ArrowRight") scrollToIndex(index + 1);
        });

        // Update index on manual scroll (best-effort)
        let raf = null;
        track.addEventListener("scroll", () => {
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const positions = slides.map((s) => Math.abs(s.offsetLeft - track.scrollLeft));
            const min = Math.min(...positions);
            const newIndex = positions.indexOf(min);
            if (newIndex !== -1 && newIndex !== index) {
              index = newIndex;
              if (dotsWrap) {
                qsa("button.dot", dotsWrap).forEach((b, idx) => {
                  b.setAttribute("aria-current", idx === index ? "true" : "false");
                });
              }
            }
          });
        });
      }
    } else {
      // Hide controls if only one slide exists
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    }
  }

  // -------- Contact preview form (client-side messaging only) --------
  const form = qs(".form");
  if (form) {
    const status = qs("[data-form-status]");
    const errorsLive = qs("[data-form-errors]");
    const fields = [
      { id: "name", label: "Name" },
      { id: "email", label: "Email" },
      { id: "message", label: "Message" },
    ];

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setErrors(msg) {
      if (errorsLive) errorsLive.textContent = msg;
    }

    function validate() {
      const invalid = [];
      fields.forEach((f) => {
        const el = qs(`#${f.id}`);
        if (!el) return;

        el.removeAttribute("aria-invalid");

        const val = (el.value || "").trim();
        if (!val) invalid.push(`${f.label} is required.`);
        if (f.id === "email" && val) {
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          if (!ok) invalid.push("Please enter a valid email address.");
        }
      });

      // Mark invalid fields
      fields.forEach((f) => {
        const el = qs(`#${f.id}`);
        if (!el) return;
        const val = (el.value || "").trim();
        if (!val) el.setAttribute("aria-invalid", "true");
        if (f.id === "email" && val) {
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          if (!ok) el.setAttribute("aria-invalid", "true");
        }
      });

      return invalid;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setStatus("");
      setErrors("");

      const invalid = validate();
      if (invalid.length) {
        setErrors(invalid.join(" "));
        setStatus("Please fix the highlighted fields.");
        return;
      }

      // Placeholder success message (no backend in Step 1)
      setStatus("Message ready to send. Please use the Contact page to submit fully.");
      form.reset();
    });
  }
})();