import videojs from "video.js";

// Register quality levels plugin
import "videojs-contrib-quality-levels";

// Register HLS quality selector plugin
import "videojs-hls-quality-selector";

// Ensure plugins are registered
export const initializeVideoJSPlugins = () => {
  // Quality levels plugin should be automatically registered
  // HLS quality selector plugin should be automatically registered

  console.log("Video.js plugins initialized");
};

export default videojs;
