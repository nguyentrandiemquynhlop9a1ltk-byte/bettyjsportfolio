/* =========================================================
   1. KHAI BÁO BIẾN TOÀN CỤC & CANVAS STARFIELD
   ========================================================= */
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let width;
let height;

// Biến lưu vị trí cuộn thực tế & mục tiêu (cho cả Trục X lẫn Trục Y)
let currentScrollX = 0, targetScrollX = 0;
let currentScrollY = 0, targetScrollY = 0;

// Vận tốc cuộn (Velocity) dùng để tạo hiệu ứng Warp kéo vệt sao
let velocityX = 0;
let velocityY = 0;

let scrollOffset = 0; // Virtual Scroll cho trang About Me

const STAR_COLOR = "#FF00FF";

/* =========================
   RESIZE CANVAS
   ========================= */
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createStars();
}

/* =========================
   CREATE STARS (MỖI SAO LÀ 1 "CÁ THỂ" ĐỘC LẬP)
   ========================= */
function createStars() {
  stars = [];
  const starCount = Math.floor((width * height) / 2000);

  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    const centerX = width / 2;
    const centerY = height / 2;

    const distanceX = (x - centerX) / centerX;
    const distanceY = (y - centerY) / centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    const depth = Math.min(distance, 1);

    let size = Math.random() * 0.6 + 0.15;
    if (Math.random() < 0.15) {
      size = Math.random() * 1.2 + 0.6; // Sao to tạo điểm nhấn
    }

    size *= 0.65 + depth * 0.5;

    stars.push({
      x: x,
      y: y,
      size: size,
      opacity: Math.random() * 0.45 + 0.55, // Nâng opacity nền lên sáng hơn
      depth: Math.random() * 0.8 + 0.1, // Độ sâu Parallax 3D
      speedFactor: Math.random() * 1.8 + 0.4, // Vận tốc riêng
      twinkleSpeed: Math.random() * 3 + 1, // Nhịp lấp lánh riêng
      glow: Math.random() < 0.25
    });
  }
}

/* =========================
   LẮNG NGHE SỰ KIỆN GALLERY SCROLL (ĐÃ FIX GIẬT LERP)
   ========================= */
window.addEventListener("galleryscroll", (e) => {
  const newTargetX = e.detail.offset || 0;
  const shift = e.detail.shift || 0;

  if (shift !== 0) {
    // Tự động bù trừ tọa độ hiện tại khi gallery thực hiện nhảy vị trí
    targetScrollX = newTargetX;
    currentScrollX += shift;
  } else {
    targetScrollX = newTargetX;
  }
});

/* =========================
   DRAW STARS
   ========================= */
function drawStars() {
  ctx.clearRect(0, 0, width, height);

  const time = Date.now() * 0.001;

  // 1. Cập nhật vị trí cuộn Y thực tế từ trang Web
  targetScrollY = (window.scrollY || document.documentElement.scrollTop || 0) + scrollOffset;

  // 2. Nội suy Lerp (Smooth Scrolling) cho cả X và Y
  const prevX = currentScrollX;
  const prevY = currentScrollY;

  currentScrollX += (targetScrollX - currentScrollX) * 0.08;
  currentScrollY += (targetScrollY - currentScrollY) * 0.08;

  // 3. Tính vận tốc cuộn X và Y (Velocity)
  velocityX = currentScrollX - prevX;
  velocityY = currentScrollY - prevY;

  // Tốc độ trôi tự do (Idle Drift) khi không thao tác
  const idleDrift = time * 6;

  for (const star of stars) {
    const speed = star.depth * star.speedFactor;

    /* -------------------------------------------------------------
       TÍNH TỌA ĐỘ X & Y VỚI HIỆU ỨNG PARALLAX
       ------------------------------------------------------------- */
    let x = star.x - currentScrollX * speed * 1.5 - idleDrift * speed * 0.2;
    x = ((x % width) + width) % width;

    const floatOffset = Math.sin(time * 1.5 + star.x * 0.01) * (star.size * 3);
    let y = star.y - currentScrollY * speed * 1.2 + floatOffset;
    y = ((y % height) + height) % height;

    /* -------------------------------------------------------------
       TÍNH ĐỘ KÉO DÃN SAO (WARP TRAIL / MOTION BLUR)
       ------------------------------------------------------------- */
    const tailX = velocityX * speed * 2.5;
    const tailY = velocityY * speed * 2.5;
    const totalSpeed = Math.sqrt(tailX * tailX + tailY * tailY);

    /* -------------------------------------------------------------
       LẤP LÁNH LIGHT
       ------------------------------------------------------------- */
    const twinkle = Math.sin(time * star.twinkleSpeed + star.x) * 0.2;
    const currentOpacity = Math.min(1, Math.max(0.5, star.opacity + twinkle));

    /* -------------------------------------------------------------
       VẼ VÀ ĐỔ BÓNG GLOW
       ------------------------------------------------------------- */
    ctx.shadowColor = STAR_COLOR;

    if (star.glow) {
      ctx.shadowBlur = star.size * (16 + totalSpeed * 0.4);
    } else {
      ctx.shadowBlur = star.size * 6;
    }

    if (totalSpeed > 1.2) {
      ctx.lineWidth = star.size * 1.2;
      ctx.strokeStyle = `rgba(255, 120, 255, ${currentOpacity})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - tailX, y - tailY);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(255, 0, 255, ${currentOpacity})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 230, 255, ${currentOpacity * 0.95})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(drawStars);
}

/* =========================================================
   2. DYNAMIC TYPOGRAPHY BACKGROUND PATTERN
   ========================================================= */
function updateTypoBackground() {
  const patternContainer = document.querySelector(".typo-bg-pattern");
  const homeFrame = document.querySelector(".home-frame");
  if (!patternContainer || !homeFrame) return;

  const frameWidth = homeFrame.clientWidth;
  const frameHeight = homeFrame.clientHeight;
  const text = "BETTYJ";

  let columns = 3;
  let rows = 9;

  if (window.innerWidth <= 600) {
    columns = 1;
    rows = 12;
  } else if (window.innerWidth <= 800) {
    columns = 2;
    rows = 10;
  }

  const tileWidth = frameWidth / columns;
  const tileHeight = frameHeight / rows;

  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");

  bgCanvas.width = tileWidth;
  bgCanvas.height = tileHeight;

  const baseFontSize = 100;
  bgCtx.font = `${baseFontSize}px Stencil, sans-serif`;

  const metrics = bgCtx.measureText(text);
  const actualAscent = metrics.actualBoundingBoxAscent;
  const actualDescent = metrics.actualBoundingBoxDescent;

  const textWidth = metrics.width;
  const textHeight = actualAscent + actualDescent;

  bgCtx.save();
  bgCtx.scale(tileWidth / textWidth, tileHeight / textHeight);

  bgCtx.font = `${baseFontSize}px Stencil, sans-serif`;
  bgCtx.fillStyle = "rgba(255, 0, 255, 0.05)";
  bgCtx.textBaseline = "top";

  bgCtx.fillText(text, 0, -(baseFontSize - actualAscent));
  bgCtx.restore();

  const dataURL = bgCanvas.toDataURL("image/png");
  patternContainer.style.backgroundImage = `url(${dataURL})`;
  patternContainer.style.backgroundSize = `${tileWidth}px ${tileHeight}px`;
}

/* =========================================================
   3. MOBILE NAVIGATION
   ========================================================= */
const navbar = document.querySelector(".navbar");
const navLogo = document.querySelector(".nav-logo");
const navLinks = document.querySelectorAll(".nav-link");

if (navLogo) {
  navLogo.addEventListener("click", (event) => {
    event.stopPropagation();
    if (window.innerWidth <= 600 && navbar) {
      navbar.classList.toggle("open");
    }
  });
}

if (navLinks) {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 600 && navbar) {
        navbar.classList.remove("open");
      }
    });
  });
}

/* =========================================================
   4. BĂNG CHUYỀN KHAY (TRANG ABOUT ME)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const mainImage = document.querySelector(".about-image");
  const wrappers = document.querySelectorAll(".khay-wrapper");
  const dots = document.querySelectorAll(".dot-item");

  if (wrappers.length === 0) return;

  const SCALE_KHAY_1 = 1;
  const SCALE_KHAY_2 = 1.19;
  const SCALE_KHAY_3 = 0.97;

  const GAP_1_2 = 600;
  const GAP_2_3 = 650;
  const GAP_3_1 = 600;
  const START_TOP = 100;

  function updateConveyor() {
    const mainWidth = mainImage ? mainImage.getBoundingClientRect().width : window.innerWidth * 0.6;
    
    const scales = [SCALE_KHAY_1, SCALE_KHAY_2, SCALE_KHAY_3];
    const gaps = [GAP_1_2, GAP_2_3, GAP_3_1];
    
    let totalLoopHeight = 0;
    const wrapperHeights = [];

    wrappers.forEach((wrapper, index) => {
      const calculatedWidth = mainWidth * scales[index];
      wrapper.style.width = `${calculatedWidth}px`;
      
      const h = wrapper.offsetHeight;
      wrapperHeights.push(h);
      totalLoopHeight += h + gaps[index];
    });

    if (totalLoopHeight === 0) return;

    const initialBaseY = window.innerHeight * (START_TOP / 100);

    wrappers.forEach((wrapper, index) => {
      let offsetForIndex = 0;
      for (let i = 0; i < index; i++) {
        offsetForIndex += wrapperHeights[i] + gaps[i];
      }

      const absoluteY = initialBaseY + offsetForIndex - scrollOffset;

      let currentY = (absoluteY - initialBaseY) % totalLoopHeight + initialBaseY;
      if (currentY < -wrapperHeights[index] - 100) {
        currentY += totalLoopHeight;
      }

      wrapper.style.transform = `translate(-50%, ${currentY}px)`;

      const threshold34 = window.innerHeight * 0.5;
      const wrapperTexts = wrapper.querySelectorAll(".khay-text, .khay-text-t");
      wrapperTexts.forEach((textEl) => {
        if (currentY <= threshold34 && currentY > -wrapperHeights[index]) {
          textEl.classList.add("show");
        } else {
          textEl.classList.remove("show");
        }
      });

      const isVisible = currentY <= window.innerHeight * 0.7 && (currentY + wrapperHeights[index]) > 0;
      if (dots[index]) {
        if (isVisible) {
          dots[index].classList.add("active");
        } else {
          dots[index].classList.remove("active");
        }
      }
    });
  }

  updateConveyor();
  window.addEventListener("resize", updateConveyor);

  window.addEventListener("wheel", (e) => {
    if (document.querySelector(".gallery-viewport")) return;

    scrollOffset += e.deltaY * 0.8;
    if (scrollOffset < 0) scrollOffset = 0;
    updateConveyor();
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (document.querySelector(".gallery-viewport")) return;

    const touchCurrentY = e.touches[0].clientY;
    const diffY = touchStartY - touchCurrentY;
    scrollOffset += diffY * 1.2;
    if (scrollOffset < 0) scrollOffset = 0;
    touchStartY = touchCurrentY;
    updateConveyor();
  }, { passive: true });
});

/* =========================================================
   5. INIT CANVAS & TYPO BACKGROUND
   ========================================================= */
resizeCanvas();
drawStars();

if (document.fonts) {
  document.fonts.ready.then(updateTypoBackground);
} else {
  window.addEventListener("load", updateTypoBackground);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  updateTypoBackground();
});

/* =====================================================
   6. GALLERY — INFINITE HORIZONTAL LOOP
   DESKTOP + TABLET + MOBILE
   ===================================================== */

function initGalleryScroll() {

  const viewport = document.querySelector(".gallery-viewport");
  const strip = document.querySelector("#galleryStrip") ||
                document.querySelector(".gallery-strip");

  let items = document.querySelectorAll(".gallery-item");
  const captionEl = document.querySelector(".gallery-caption");

  if (!viewport || !strip || items.length === 0) return;


  /* =====================================================
     PROJECT TITLES
     ===================================================== */

  const customTitles = [
    "Helena Artwork Recreation",
    "awake",
    "Identity in Contrast",
    "So Xau Media",
    "Gluttony",
    "Cigar Tycoon",
    "The Punishment"
  ];


  /* =====================================================
     SETTINGS
     ===================================================== */

  const MOBILE_BREAKPOINT = 900;

  // Tốc độ gallery desktop
  const DESKTOP_SPEED = 1.2;

  // Mobile không dùng speed multiplier nữa.
  // Nó sẽ lấy trực tiếp scroll position.
  const MOBILE_SPEED = 1;


  /* =====================================================
     STATE
     ===================================================== */

  let x = 0;

  // Tổng chiều dài của 1 bộ gallery
  let loopWidth = 0;

  // Offset cũ dùng để tính velocity ổn định
  let previousX = 0;

  // Đang reset mobile scroll hay không
  let isResettingMobile = false;

  // Clone được tạo riêng cho mobile
  let mobilePrependedClone = null;


  /* =====================================================
     DETECT MOBILE
     ===================================================== */

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }


  /* =====================================================
     CREATE MOBILE CLONE
     ===================================================== */

  function setupMobileLoop() {

    if (!isMobile()) return;

    // Không tạo clone lần 2
    if (mobilePrependedClone) return;


    /*
      Gallery ban đầu:

      [ ORIGINAL ][ DUPLICATE ]

      Mobile sẽ trở thành:

      [ CLONE ][ ORIGINAL ][ DUPLICATE ]

      Như vậy có thể kéo được cả trái và phải.
    */

    const originalItems = Array.from(
      strip.querySelectorAll(".gallery-item")
    );


    const originalCount = customTitles.length;

    if (originalItems.length < originalCount) return;


    /*
      Lấy đúng 7 item đầu tiên làm clone.
    */

    const cloneItems =
      originalItems.slice(0, originalCount);


    const fragment =
      document.createDocumentFragment();


    cloneItems.forEach(item => {

      const clone =
        item.cloneNode(true);

      clone.dataset.mobileClone = "true";

      fragment.appendChild(clone);

    });


    strip.insertBefore(
      fragment,
      strip.firstChild
    );


    mobilePrependedClone = true;


    /*
      Update lại danh sách items
      để caption nhận diện cả 3 bộ.
    */

    items =
      strip.querySelectorAll(".gallery-item");
  }


  /* =====================================================
     REMOVE MOBILE CLONE
     ===================================================== */

  function removeMobileLoop() {

    if (!mobilePrependedClone) return;


    const clones =
      strip.querySelectorAll(
        ".gallery-item[data-mobile-clone='true']"
      );


    clones.forEach(clone => {
      clone.remove();
    });


    mobilePrependedClone = null;


    /*
      Update lại danh sách items.
    */

    items =
      strip.querySelectorAll(".gallery-item");
  }


  /* =====================================================
     GET LOOP WIDTH
     ===================================================== */

  function calculateLoopWidth() {

    /*
      Desktop:

      [ ORIGINAL ][ DUPLICATE ]

      → totalWidth / 2


      Mobile:

      [ CLONE ][ ORIGINAL ][ DUPLICATE ]

      → totalWidth / 3
    */

    const totalWidth =
      strip.scrollWidth;


    if (totalWidth <= 0) {

      loopWidth = 0;

      return;
    }


    if (isMobile()) {

      loopWidth =
        totalWidth / 3;

    } else {

      loopWidth =
        totalWidth / 2;

    }
  }


  /* =====================================================
     CAPTION
     ===================================================== */

  function updateCaption() {

    if (!captionEl || loopWidth <= 0) return;


    const viewportCenter =
      viewport.getBoundingClientRect().left +
      viewport.clientWidth / 2;


    let closestIndex = 0;

    let minDistance = Infinity;


    items.forEach((item, index) => {

      const rect =
        item.getBoundingClientRect();


      const itemCenter =
        rect.left + rect.width / 2;


      const distance =
        Math.abs(
          itemCenter - viewportCenter
        );


      if (distance < minDistance) {

        minDistance = distance;

        closestIndex = index;

      }

    });


    /*
      Mobile:

      [ CLONE 0-6 ]
      [ ORIGINAL 0-6 ]
      [ DUPLICATE 0-6 ]

      Desktop:

      [ ORIGINAL 0-6 ]
      [ DUPLICATE 0-6 ]

      Modulo vẫn lấy đúng title.
    */

    const originalCount =
      customTitles.length;


    const activeIndex =
      closestIndex % originalCount;


    captionEl.textContent =
      customTitles[activeIndex] ||
      String(activeIndex + 1);
  }


  /* =====================================================
     SYNC STARFIELD
     ===================================================== */

  function syncStarfield(shift = 0) {

    if (loopWidth <= 0) return;


    window.galleryHorizontalOffset = x;


    window.galleryScrollProgress =
      x / loopWidth;


    window.dispatchEvent(
      new CustomEvent("galleryscroll", {

        detail: {

          progress:
            window.galleryScrollProgress,

          offset: x,

          shift: shift

        }

      })
    );
  }


  /* =====================================================
     DESKTOP UPDATE
     ===================================================== */

  function updateDesktopGallery() {

    if (loopWidth <= 0) return;


    let shift = 0;


    if (x >= loopWidth) {

      x -= loopWidth;

      shift = -loopWidth;

    }


    else if (x < 0) {

      x += loopWidth;

      shift = loopWidth;

    }


    strip.style.transform =
      `translate3d(${-x}px, 0, 0)`;


    syncStarfield(shift);


    updateCaption();
  }


  /* =====================================================
     MOBILE UPDATE
     ===================================================== */

  function updateMobileGallery() {

    if (loopWidth <= 0) return;

    if (isResettingMobile) return;


    let scrollPosition =
      viewport.scrollLeft;


    let shift = 0;


    /*
      MOBILE STRUCTURE:

      0
      ↓

      [ CLONE ][ ORIGINAL ][ DUPLICATE ]
               ↑
            START


      ORIGINAL starts at:

      loopWidth
    */


    /* ---------------------------------------------
       ĐI SANG PHẢI
       --------------------------------------------- */

    if (
      scrollPosition >=
      loopWidth * 2
    ) {

      const overshoot =
        scrollPosition -
        loopWidth * 2;


      shift = -loopWidth;


      isResettingMobile = true;


      const newPosition =
        loopWidth + overshoot;


      viewport.scrollLeft =
        newPosition;


      scrollPosition =
        newPosition;


      isResettingMobile = false;
    }


    /* ---------------------------------------------
       ĐI SANG TRÁI
       --------------------------------------------- */

    /*
      Vì browser không cho scrollLeft âm,
      ta reset TRƯỚC KHI chạm hẳn vào 0.

      Khi <= 1px:

      [ CLONE ] → [ ORIGINAL ]

      reset về vị trí tương ứng trong
      ORIGINAL.
    */

    else if (
      scrollPosition <= 1
    ) {

      const overshoot =
        scrollPosition;


      shift = loopWidth;


      isResettingMobile = true;


      const newPosition =
        loopWidth + overshoot;


      viewport.scrollLeft =
        newPosition;


      scrollPosition =
        newPosition;


      isResettingMobile = false;
    }


    /*
      Cập nhật state
    */

    x =
      scrollPosition;


    /*
      Mobile không dùng transform.
    */

    strip.style.transform =
      "translate3d(0, 0, 0)";


    /*
      Sync starfield
    */

    syncStarfield(shift);


    /*
      Caption
    */

    updateCaption();
  }


  /* =====================================================
     MAIN UPDATE
     ===================================================== */

  function updateGallery() {

    /*
      Mobile cần 3 bộ.
    */

    if (isMobile()) {

      setupMobileLoop();

    } else {

      removeMobileLoop();

    }


    calculateLoopWidth();


    if (loopWidth <= 0) return;


    if (isMobile()) {

      updateMobileGallery();

    } else {

      updateDesktopGallery();

    }
  }


  /* =====================================================
     DESKTOP / TABLET WHEEL
     ===================================================== */

  function handleWheel(e) {

    /*
      ≤900px:

      KHÔNG can thiệp wheel.
      Browser tự xử lý.
    */

    if (isMobile()) return;


    const gallery =
      document.querySelector(".gallery-page");


    const delta =
      Math.abs(e.deltaX) >
      Math.abs(e.deltaY)
        ? e.deltaX
        : e.deltaY;


    e.preventDefault();


    x +=
      delta *
      DESKTOP_SPEED;


    updateDesktopGallery();
  }


  window.addEventListener(
    "wheel",
    handleWheel,
    {
      passive: false
    }
  );


  /* =====================================================
     MOBILE SCROLL
     ===================================================== */

  viewport.addEventListener(
    "scroll",
    () => {

      if (!isMobile()) return;


      updateMobileGallery();

    },
    {
      passive: true
    }
  );


  /* =====================================================
     RESIZE
     ===================================================== */

  window.addEventListener(
    "resize",
    () => {

      /*
        Mobile → Desktop
      */

      if (!isMobile()) {

        removeMobileLoop();

      }


      /*
        Desktop → Mobile
      */

      else {

        setupMobileLoop();

      }


      calculateLoopWidth();


      if (!isMobile()) {

        if (loopWidth > 0) {

          x =
            ((x % loopWidth) +
            loopWidth) %
            loopWidth;

        }

      }


      updateGallery();

    }
  );


  /* =====================================================
     INITIALIZE
     ===================================================== */

  if (!isMobile()) {

    calculateLoopWidth();

    x = 0;

    updateDesktopGallery();

  }


  /*
    MOBILE INITIALIZE

    Start ở ORIGINAL,
    không phải CLONE.
  */

  else {

    setupMobileLoop();

    calculateLoopWidth();


    /*
      [ CLONE ][ ORIGINAL ][ DUPLICATE ]
                ↑
              START
    */

    viewport.scrollLeft =
      loopWidth;


    x =
      loopWidth;


    updateMobileGallery();

  }


  /* =====================================================
     WAIT FOR IMAGE LOAD
     ===================================================== */

  setTimeout(() => {

    calculateLoopWidth();


    /*
      Nếu mobile:

      luôn giữ vị trí ở ORIGINAL.
    */

    if (isMobile()) {

      if (
        viewport.scrollLeft <
        loopWidth
      ) {

        viewport.scrollLeft =
          loopWidth;

      }

    }


    updateGallery();

  }, 300);


  setTimeout(() => {

    calculateLoopWidth();


    if (isMobile()) {

      if (
        viewport.scrollLeft <
        loopWidth
      ) {

        viewport.scrollLeft =
          loopWidth;

      }

    }


    updateGallery();

  }, 1000);
}


/* =====================================================
   START GALLERY
   ===================================================== */

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initGalleryScroll
  );

} else {

  initGalleryScroll();

}


/* =========================================================
   SUB-GALLERY
   EQUAL HEIGHT + ORIGINAL ASPECT RATIO
   ========================================================= */

function updateSubGalleryRows() {

  const rows =
    document.querySelectorAll(
      ".sub-gallery-row"
    );


  rows.forEach(row => {

    const items =
      row.querySelectorAll(".sm-item");


    const images =
      row.querySelectorAll("img");


    if (
      items.length !== 2 ||
      images.length !== 2
    ) {

      return;

    }


    const img1 =
      images[0];


    const img2 =
      images[1];


    /* -----------------------------------------
       IMAGE CHƯA LOAD
       ----------------------------------------- */

    if (
      !img1.naturalWidth ||
      !img1.naturalHeight ||
      !img2.naturalWidth ||
      !img2.naturalHeight
    ) {

      return;

    }


    /* -----------------------------------------
       ORIGINAL ASPECT RATIO
       ----------------------------------------- */

    const ratio1 =
      img1.naturalWidth /
      img1.naturalHeight;


    const ratio2 =
      img2.naturalWidth /
      img2.naturalHeight;


    /* -----------------------------------------
       AVAILABLE WIDTH
       ----------------------------------------- */

    const totalWidth =
      row.clientWidth;


    /* -----------------------------------------
       GAP
       ----------------------------------------- */

    const gap =
      parseFloat(
        getComputedStyle(row).columnGap
      ) || 0;


    /* -----------------------------------------
       COMMON HEIGHT
       ----------------------------------------- */

    const commonHeight =
      (totalWidth - gap) /
      (ratio1 + ratio2);


    /* -----------------------------------------
       WIDTH
       ----------------------------------------- */

    const width1 =
      commonHeight * ratio1;


    const width2 =
      commonHeight * ratio2;


    /* -----------------------------------------
       APPLY SIZE
       ----------------------------------------- */

    items[0].style.width =
      `${width1}px`;


    items[0].style.height =
      `${commonHeight}px`;


    items[1].style.width =
      `${width2}px`;


    items[1].style.height =
      `${commonHeight}px`;

  });
}


/* =========================================================
   INITIALIZE AFTER IMAGES LOAD
   ========================================================= */

function initSubGalleryRows() {

  const images =
    document.querySelectorAll(
      ".sub-gallery-row img"
    );


  if (!images.length) {

    return;

  }


  let loaded = 0;


  function imageReady() {

    loaded++;


    if (
      loaded >= images.length
    ) {

      updateSubGalleryRows();

    }

  }


  images.forEach(img => {

    if (img.complete) {

      imageReady();

    }

    else {

      img.addEventListener(
        "load",
        imageReady,
        {
          once: true
        }
      );


      img.addEventListener(
        "error",
        imageReady,
        {
          once: true
        }
      );

    }

  });

}


/* =========================================================
   RESPONSIVE
   ========================================================= */

let galleryResizeTimer;


window.addEventListener(
  "resize",
  () => {

    clearTimeout(
      galleryResizeTimer
    );


    galleryResizeTimer =
      setTimeout(() => {

        updateSubGalleryRows();

      }, 50);

  }
);


/* =========================================================
   START
   ========================================================= */

initSubGalleryRows();


const customCursor =
  document.querySelector(
    ".custom-cursor"
  );


document.addEventListener(
  "mousemove",
  (e) => {

    customCursor.style.left =
      `${e.clientX}px`;

    customCursor.style.top =
      `${e.clientY}px`;

  }
);


const clickableElements =
  document.querySelectorAll(
    "a, button, input, textarea, select, [role='button']"
  );


clickableElements.forEach(
  (element) => {

    element.addEventListener(
      "mouseenter",
      () => {

        customCursor.classList.add(
          "is-hovering"
        );

      }
    );


    element.addEventListener(
      "mouseleave",
      () => {

        customCursor.classList.remove(
          "is-hovering"
        );

      }
    );

  }
);


document.addEventListener(
  "DOMContentLoaded",
  function () {

    const video =
      document.getElementById(
        "hero-bag-video"
      );


    const scanBtn =
      document.getElementById(
        "scan-control-btn"
      );


    if (video && scanBtn) {

      scanBtn.addEventListener(
        "click",
        function (e) {

          e.preventDefault();


          // Kiểm tra thực tế video đang chạy hay đang dừng

          if (
            !video.paused &&
            !video.ended
          ) {

            video.pause();


            scanBtn.textContent =
              "Scan this before our flight";

          }

          else {

            video.play();


            scanBtn.textContent =
              "Stop scanning";

          }

        }
      );

    }

  }
);


const cursor =
  document.querySelector(
    '.custom-cursor'
  );


document.addEventListener(
  'mousemove',
  (e) => {

    cursor.style.left =
      e.clientX + 'px';


    cursor.style.top =
      e.clientY + 'px';

  }
);

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  syncTouch: false
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

