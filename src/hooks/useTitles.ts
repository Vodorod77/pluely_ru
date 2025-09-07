import { useApp } from "@/contexts";
import { useEffect } from "react";

/**
 * Hook to conditionally render titles based on user preference
 * @param titleText The title text to render if enabled
 * @returns The title text if enabled, empty string if disabled
 */
export const useTitles = () => {
  const { customizable } = useApp();

  const getTitle = (titleText: string): string => {
    return customizable?.titles?.isEnabled ? titleText : "";
  };

  // Handle title visibility globally
  useEffect(() => {
    const manageTitles = () => {
      const rootElement = document.documentElement;
      const allElementsWithTitles = document.querySelectorAll("[title]");

      if (customizable?.titles?.isEnabled) {
        rootElement?.removeAttribute("data-titles-disabled");
        rootElement?.setAttribute("data-titles-enabled", "true");

        // Restore original titles from data-original-title attributes
        allElementsWithTitles.forEach((element) => {
          const originalTitle = element.getAttribute("data-original-title");
          if (originalTitle) {
            element.setAttribute("title", originalTitle);
          }
        });
      } else {
        rootElement?.setAttribute("data-titles-disabled", "true");
        rootElement?.removeAttribute("data-titles-enabled");

        // Store original titles and remove them
        allElementsWithTitles.forEach((element) => {
          const currentTitle = element.getAttribute("title");
          if (currentTitle && !element.hasAttribute("data-original-title")) {
            element.setAttribute("data-original-title", currentTitle);
          }
          element.removeAttribute("title");
        });
      }
    };

    // Use setTimeout to ensure DOM is fully loaded
    const timeoutId = setTimeout(manageTitles, 100);

    // Set up mutation observer to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
      let hasNewTitles = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.hasAttribute("title") ||
              element.querySelector("[title]")
            ) {
              hasNewTitles = true;
            }
          }
        });
      });

      if (hasNewTitles && !customizable?.titles?.isEnabled) {
        // If titles are disabled and new elements with titles were added, remove them
        setTimeout(() => {
          const newElementsWithTitles = document.querySelectorAll(
            "[title]:not([data-original-title])"
          );
          newElementsWithTitles.forEach((element) => {
            const currentTitle = element.getAttribute("title");
            if (currentTitle) {
              element.setAttribute("data-original-title", currentTitle);
              element.removeAttribute("title");
            }
          });
        }, 0);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title"],
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [customizable?.titles?.isEnabled]);

  return {
    getTitle,
    isTitlesEnabled: customizable?.titles?.isEnabled,
  };
};
