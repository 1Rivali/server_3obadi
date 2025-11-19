// JavaScript helper to find and capture video elements
// This runs in the browser context and has full DOM access

window.findVideoElements = function () {
  console.log("=== JavaScript: Searching for video elements ===");

  // Method 1: Direct query in document
  let videos = document.querySelectorAll("video");
  console.log("Direct query found:", videos.length, "video elements");

  // Method 2: Look specifically in flt-platform-view elements
  if (videos.length === 0) {
    console.log("Looking in flt-platform-view elements...");
    const platformViews = document.querySelectorAll("flt-platform-view");
    console.log("Found", platformViews.length, "platform views");

    platformViews.forEach((pv, index) => {
      console.log(`Platform view ${index}:`, pv.id, pv.slot);
      const pvVideos = pv.querySelectorAll("video");
      if (pvVideos.length > 0) {
        console.log(`  -> Found ${pvVideos.length} video(s) inside`);
        videos = pvVideos; // Use the first platform view with video
      }
    });
  }

  // Log video details
  if (videos.length > 0) {
    videos.forEach((video, index) => {
      console.log(`Video ${index}:`, {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        muted: video.muted,
        autoplay: video.autoplay,
        src: video.src || "none",
        srcObject: video.srcObject ? "Has MediaStream" : "No MediaStream",
        parentElement: video.parentElement?.tagName,
      });
    });
  } else {
    console.warn("No video elements found anywhere!");

    // Debug: show what elements exist
    const allElements = document.querySelectorAll("*");
    const elementTypes = new Set();
    allElements.forEach((el) => elementTypes.add(el.tagName.toLowerCase()));
    console.log("All element types in DOM:", Array.from(elementTypes).sort());
  }

  return videos.length;
};

window.captureVideoFrame = async function () {
  console.log("=== JavaScript: Attempting to capture video frame ===");

  // First try direct query
  let videos = document.querySelectorAll("video");

  // If not found, look in platform views
  if (videos.length === 0) {
    console.log("Looking for video in platform views...");
    const platformViews = document.querySelectorAll("flt-platform-view");

    for (let i = 0; i < platformViews.length; i++) {
      const pvVideos = platformViews[i].querySelectorAll("video");
      if (pvVideos.length > 0) {
        videos = pvVideos;
        console.log("Found video in platform view:", platformViews[i].id);
        break;
      }
    }
  }

  if (videos.length === 0) {
    console.error("No video elements found");
    return null;
  }

  const video = videos[0];
  console.log("Video element found:", {
    width: video.videoWidth,
    height: video.videoHeight,
    readyState: video.readyState,
    readyStateText: [
      "HAVE_NOTHING",
      "HAVE_METADATA",
      "HAVE_CURRENT_DATA",
      "HAVE_FUTURE_DATA",
      "HAVE_ENOUGH_DATA",
    ][video.readyState],
    paused: video.paused,
    ended: video.ended,
    currentTime: video.currentTime,
  });

  // Wait for video to be ready if needed
  if (
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    console.log("Video not ready, waiting for loadeddata event...");

    // Wait up to 2 seconds for video to be ready
    const readyPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error("Timeout waiting for video to be ready");
        resolve(false);
      }, 2000);

      const checkReady = () => {
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          clearTimeout(timeout);
          console.log("Video is now ready!");
          resolve(true);
        }
      };

      video.addEventListener("loadeddata", checkReady, { once: true });
      video.addEventListener("canplay", checkReady, { once: true });

      // Check immediately in case it's already ready
      checkReady();
    });

    const isReady = await readyPromise;
    if (!isReady) {
      console.error("Video never became ready");
      return null;
    }
  }

  console.log("Final video state before capture:", {
    width: video.videoWidth,
    height: video.videoHeight,
    readyState: video.readyState,
  });

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.error("Video dimensions are still 0 - cannot capture");
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log("Created canvas:", canvas.width, "x", canvas.height);

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Check if we actually drew something
    const imageData = ctx.getImageData(
      0,
      0,
      Math.min(10, canvas.width),
      Math.min(10, canvas.height)
    );
    const hasData = imageData.data.some((byte) => byte !== 0);
    console.log("Canvas has non-zero data:", hasData);

    if (!hasData) {
      console.warn(
        "Canvas appears to be empty (all zeros). This might be a timing or CORS issue."
      );
    }

    // Return base64 data URL
    const dataUrl = canvas.toDataURL("image/png");
    console.log(
      "✓ Successfully captured image, data URL length:",
      dataUrl.length
    );

    return dataUrl;
  } catch (error) {
    console.error("Error capturing video frame:", error);
    return null;
  }
};
