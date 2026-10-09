document.addEventListener("DOMContentLoaded", function () {
  const message = document.querySelector(".top-message");
  const closeMessage = document.getElementById("closeMessage");

  if (closeMessage && message) {
    closeMessage.addEventListener("click", function () {
      message.style.display = "none";
    });
  }
});


const contactForm = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");

contactForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const button = contactForm.querySelector("button[type='submit']");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Sending...";
  formNote.textContent = "Please wait...";
  formNote.style.color = "";

  try {
    const response = await fetch("php/contact.php", {
      method: "POST",
      body: new FormData(contactForm)
    });

    const result = await response.json();

    if (result.success) {
      formNote.textContent = result.message;
      formNote.style.color = "#4f9d3a";
      contactForm.reset();
    } else {
      formNote.textContent = result.message || "Unable to send your message.";
      formNote.style.color = "#b42318";
    }
  } catch (error) {
    formNote.textContent =
      "The message could not be sent. Please check your PHP/server settings.";
    formNote.style.color = "#b42318";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});
/* =========================================================
   CHELS WELLNESS
   TESTIMONIAL SLIDER - PART 3
   ADD TO THE BOTTOM OF EXISTING script.js
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* -----------------------------------------------------
       ELEMENTS
    ----------------------------------------------------- */
    const track = document.getElementById("slidesTrack");
    const slides = Array.from(
        document.querySelectorAll(".testimonial-card")
    );

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const dotsContainer = document.getElementById("sliderDots");
    const autoPlayBtn = document.getElementById("autoPlayBtn");

    const slider = document.getElementById("testimonialSlider");

    /* -----------------------------------------------------
       FOOTER YEAR
    ----------------------------------------------------- */
    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }


    /* -----------------------------------------------------
       MOBILE MENU
       Works only if these elements exist
    ----------------------------------------------------- */
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", function () {

            const isOpen = mainNav.classList.toggle("open");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        /* Close menu after clicking a link */
        const navLinks = mainNav.querySelectorAll("a");

        navLinks.forEach(function (link) {

            link.addEventListener("click", function () {

                mainNav.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

    }


    /* -----------------------------------------------------
       STOP IF SLIDER DOES NOT EXIST
    ----------------------------------------------------- */
    if (
        !track ||
        slides.length === 0 ||
        !dotsContainer
    ) {
        return;
    }


    /* -----------------------------------------------------
       SLIDER SETTINGS
    ----------------------------------------------------- */
    let currentSlide = 0;

    let autoPlay = true;

    let autoPlayTimer = null;

    const intervalTime = 5000;


    /* -----------------------------------------------------
       CREATE DOTS
    ----------------------------------------------------- */
    slides.forEach(function (slide, index) {

        const dot = document.createElement("button");

        dot.type = "button";

        dot.className = "dot";

        dot.setAttribute(
            "aria-label",
            "Go to testimonial " + (index + 1)
        );

        dot.addEventListener("click", function () {

            goToSlide(index);

            restartAutoPlay();

        });

        dotsContainer.appendChild(dot);

    });


    const dots = Array.from(
        dotsContainer.querySelectorAll(".dot")
    );


    /* -----------------------------------------------------
       UPDATE SLIDER
    ----------------------------------------------------- */
    function updateSlider() {

        track.style.transform =
            "translateX(-" + (currentSlide * 100) + "%)";


        /* Update dots */
        dots.forEach(function (dot, index) {

            dot.classList.toggle(
                "active",
                index === currentSlide
            );

        });


        /* Accessibility */
        slides.forEach(function (slide, index) {

            slide.setAttribute(
                "aria-hidden",
                index === currentSlide ? "false" : "true"
            );

        });

    }


    /* -----------------------------------------------------
       GO TO SLIDE
    ----------------------------------------------------- */
    function goToSlide(index) {

        currentSlide =
            (index + slides.length) % slides.length;

        updateSlider();

    }


    /* -----------------------------------------------------
       NEXT SLIDE
    ----------------------------------------------------- */
    function nextSlide() {

        goToSlide(currentSlide + 1);

    }


    /* -----------------------------------------------------
       PREVIOUS SLIDE
    ----------------------------------------------------- */
    function previousSlide() {

        goToSlide(currentSlide - 1);

    }


    /* -----------------------------------------------------
       NEXT BUTTON
    ----------------------------------------------------- */
    if (nextBtn) {

        nextBtn.addEventListener("click", function () {

            nextSlide();

            restartAutoPlay();

        });

    }


    /* -----------------------------------------------------
       PREVIOUS BUTTON
    ----------------------------------------------------- */
    if (prevBtn) {

        prevBtn.addEventListener("click", function () {

            previousSlide();

            restartAutoPlay();

        });

    }


    /* -----------------------------------------------------
       START AUTOPLAY
    ----------------------------------------------------- */
    function startAutoPlay() {

        stopAutoPlay();

        if (!autoPlay) {
            return;
        }

        autoPlayTimer = setInterval(
            nextSlide,
            intervalTime
        );

    }


    /* -----------------------------------------------------
       STOP AUTOPLAY
    ----------------------------------------------------- */
    function stopAutoPlay() {

        if (autoPlayTimer) {

            clearInterval(autoPlayTimer);

            autoPlayTimer = null;

        }

    }


    /* -----------------------------------------------------
       RESTART AUTOPLAY
    ----------------------------------------------------- */
    function restartAutoPlay() {

        if (autoPlay) {

            startAutoPlay();

        }

    }


    /* -----------------------------------------------------
       AUTOPLAY BUTTON TEXT
    ----------------------------------------------------- */
    function updateAutoPlayButton() {

        if (!autoPlayBtn) {
            return;
        }


        if (autoPlay) {

            autoPlayBtn.innerHTML =
                "<span>Ⅱ</span> Pause Auto Slide";

        } else {

            autoPlayBtn.innerHTML =
                "<span>▶</span> Play Auto Slide";

        }

    }


    /* -----------------------------------------------------
       AUTOPLAY BUTTON
    ----------------------------------------------------- */
    if (autoPlayBtn) {

        autoPlayBtn.addEventListener(
            "click",
            function () {

                autoPlay = !autoPlay;


                if (autoPlay) {

                    startAutoPlay();

                } else {

                    stopAutoPlay();

                }


                updateAutoPlayButton();

            }
        );

    }


    /* -----------------------------------------------------
       MOBILE SWIPE SUPPORT
    ----------------------------------------------------- */
    let touchStartX = 0;
    let touchEndX = 0;


    track.addEventListener(
        "touchstart",
        function (event) {

            touchStartX =
                event.changedTouches[0].screenX;

            stopAutoPlay();

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "touchend",
        function (event) {

            touchEndX =
                event.changedTouches[0].screenX;


            const swipeDistance =
                touchEndX - touchStartX;


            /* Swipe left */
            if (swipeDistance < -50) {

                nextSlide();

            }


            /* Swipe right */
            if (swipeDistance > 50) {

                previousSlide();

            }


            if (autoPlay) {

                startAutoPlay();

            }

        },
        {
            passive: true
        }
    );


    /* -----------------------------------------------------
       PAUSE WHEN MOUSE IS OVER SLIDER
    ----------------------------------------------------- */
    if (slider) {

        slider.addEventListener(
            "mouseenter",
            function () {

                stopAutoPlay();

            }
        );


        slider.addEventListener(
            "mouseleave",
            function () {

                if (autoPlay) {

                    startAutoPlay();

                }

            }
        );

    }


    /* -----------------------------------------------------
       KEYBOARD ARROWS
    ----------------------------------------------------- */
    document.addEventListener(
        "keydown",
        function (event) {

            /* Right arrow */
            if (event.key === "ArrowRight") {

                nextSlide();

                restartAutoPlay();

            }


            /* Left arrow */
            if (event.key === "ArrowLeft") {

                previousSlide();

                restartAutoPlay();

            }

        }
    );


    /* -----------------------------------------------------
       INITIALIZE
    ----------------------------------------------------- */
    updateSlider();

    updateAutoPlayButton();

    startAutoPlay();

});