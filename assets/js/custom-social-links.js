console.log("custom-social-links.js 已載入");

(function () {
  const YOUTUBE_URL = "https://www.youtube.com/@itribgc";
  const INSTAGRAM_URL = "https://www.instagram.com/itri_bgc/";

  function fixSocialLinks() {
    const links = document.querySelectorAll("a[href]");

    links.forEach(function (link) {
      const href = link.getAttribute("href") || "";
      const text = (link.textContent || "").toLowerCase();
      const aria = (link.getAttribute("aria-label") || "").toLowerCase();
      const title = (link.getAttribute("title") || "").toLowerCase();
      const className = (link.className || "").toString().toLowerCase();

      const all = [href, text, aria, title, className].join(" ");

      if (
        all.includes("youtube") ||
        href.includes("youtube.com") ||
        href.includes("youtu.be")
      ) {
        link.setAttribute("href", YOUTUBE_URL);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("aria-label", "YouTube");
        link.setAttribute("title", "YouTube");
      }

      if (
        all.includes("instagram") ||
        href.includes("instagram.com")
      ) {
        link.setAttribute("href", INSTAGRAM_URL);
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.setAttribute("aria-label", "Instagram");
        link.setAttribute("title", "Instagram");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fixSocialLinks();
    setTimeout(fixSocialLinks, 500);
    setTimeout(fixSocialLinks, 1200);
  });

  window.addEventListener("load", function () {
    fixSocialLinks();
    setTimeout(fixSocialLinks, 500);
  });

  const pushStateEl = document.querySelector("hy-push-state");

  if (pushStateEl) {
    pushStateEl.addEventListener("load", function () {
      fixSocialLinks();
      setTimeout(fixSocialLinks, 500);
    });
  }
})();
