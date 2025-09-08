import React, { useEffect, useState, useRef } from "react";
import "video.js/dist/video-js.css";
import videojs from "video.js";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchVideoDetails } from "@/lib/apis";
import { Loader2, AlertCircle } from "lucide-react";
import { decrypt } from "@/lib/decrypt";

// Video progress tracking types
interface VideoProgress {
  videoId: string;
  courseId: string;
  currentTime: number;
  duration: number;
  isCompleted: boolean;
  lastWatched: number; // timestamp
}

// Local storage utilities for video progress
const getVideoProgress = (
  videoId: string,
  courseId: string
): VideoProgress | null => {
  try {
    const stored = localStorage.getItem(
      `video_progress_${courseId}_${videoId}`
    );
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveVideoProgress = (progress: VideoProgress): void => {
  try {
    localStorage.setItem(
      `video_progress_${progress.courseId}_${progress.videoId}`,
      JSON.stringify(progress)
    );
  } catch (error) {
    console.error("Failed to save video progress:", error);
  }
};

const isVideoWatched = (videoId: string, courseId: string): boolean => {
  const progress = getVideoProgress(videoId, courseId);
  return progress?.isCompleted || false;
};

// Playback speed persistence utilities
const getPlaybackSpeed = (): number => {
  try {
    const stored = localStorage.getItem("video_playback_speed");
    return stored ? parseFloat(stored) : 1;
  } catch {
    return 1;
  }
};

const savePlaybackSpeed = (speed: number): void => {
  try {
    localStorage.setItem("video_playback_speed", speed.toString());
  } catch (error) {
    console.error("Failed to save playback speed:", error);
  }
};

// Format time in MM:SS or HH:MM:SS format
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

interface VideoPlayerProps {
  videoId: string;
  courseId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  courseId,
  videoTitle,
  isOpen,
  onClose,
}) => {
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() =>
    getPlaybackSpeed()
  );
  const [availableQualities, setAvailableQualities] = useState<
    Array<{
      quality: string;
      bitrate: number;
      url: string;
      type: "hls" | "mp4";
    }>
  >([]);
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: videoData,
    isLoading: isVideoLoading,
    error,
  } = useQuery({
    queryKey: ["video", videoId, courseId],
    queryFn: () => fetchVideoDetails(videoId, courseId),
    enabled: isOpen && !!videoId && !!courseId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (videoData?.data) {
      setAvailableQualities(
        videoData.data.download_links.map((l) => {
          const isHls = l.path.split("?")[0].endsWith(".m3u8");
          return {
            quality: l.quality,
            bitrate: parseInt(l.quality.replace("p", "")),
            url: decrypt(l.path),
            type: isHls ? "hls" : "mp4",
          };
        }) || []
      );
    }
  }, [videoData]);

  // Load saved progress when component mounts
  useEffect(() => {
    if (videoId && courseId && isOpen) {
      const progress = getVideoProgress(videoId, courseId);
      setSavedProgress(progress);
    }
  }, [videoId, courseId, isOpen]);

  const currentVideoUrl =
    selectedQuality === "auto"
      ? availableQualities[0]?.url
      : availableQualities.find((q) => q.quality === selectedQuality)?.url ||
        availableQualities[0]?.url;

  // Initialize Video.js player once
  useEffect(() => {
    if (videoRef.current && isOpen && availableQualities.length > 0) {
      if (!playerRef.current) {
        // Initialize new player only if it doesn't exist
        const player = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          preload: "auto",
          fluid: true,
          responsive: true,
          playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        });

        // Set up progress tracking
        player.ready(() => {
          // Restore saved progress - but start from beginning if video was completed
          if (
            savedProgress &&
            savedProgress.currentTime > 10 &&
            !savedProgress.isCompleted
          ) {
            player.currentTime(savedProgress.currentTime);
          }

          // Restore saved playback speed - try multiple times to ensure it sticks
          const restoreSpeed = () => {
            const savedSpeed = getPlaybackSpeed();
            console.log("Attempting to restore speed:", savedSpeed);
            player.playbackRate(savedSpeed);

            // Verify it was set correctly after a short delay
            setTimeout(() => {
              const currentRate = player.playbackRate();
              console.log(
                "Current rate after setting:",
                currentRate,
                "Expected:",
                savedSpeed
              );
              if (
                typeof currentRate === "number" &&
                Math.abs(currentRate - savedSpeed) > 0.01
              ) {
                console.log("Speed not set correctly, retrying...");
                player.playbackRate(savedSpeed);
              }
            }, 100);
          };

          // Try to restore speed immediately and after the video loads
          restoreSpeed();
          player.on("loadedmetadata", restoreSpeed);
          player.on("canplay", restoreSpeed);

          // Set up rate change tracking after a short delay
          setTimeout(() => {
            player.on("ratechange", () => {
              const newRate = player.playbackRate();
              const currentSpeed = getPlaybackSpeed();
              if (
                typeof newRate === "number" &&
                Math.abs(newRate - currentSpeed) > 0.01
              ) {
                console.log(
                  "User changed speed from",
                  currentSpeed,
                  "to",
                  newRate
                );
                setPlaybackSpeed(newRate);
                savePlaybackSpeed(newRate);
              }
            });
          }, 500);

          // Track progress every 5 seconds
          const saveProgress = () => {
            if (progressSaveTimeoutRef.current) {
              clearTimeout(progressSaveTimeoutRef.current);
            }

            progressSaveTimeoutRef.current = setTimeout(() => {
              const currentTime = player.currentTime();
              const duration = player.duration();

              if (
                typeof currentTime === "number" &&
                typeof duration === "number" &&
                currentTime > 0 &&
                duration > 0
              ) {
                const progress: VideoProgress = {
                  videoId,
                  courseId,
                  currentTime,
                  duration,
                  isCompleted: currentTime >= duration * 0.9, // Mark as completed at 90%
                  lastWatched: Date.now(),
                };

                saveVideoProgress(progress);
                setSavedProgress(progress);
              }
            }, 1000); // Debounce for 1 second
          };

          // Save progress on time update
          player.on("timeupdate", saveProgress);

          // Save progress on pause
          player.on("pause", saveProgress);

          // Mark as completed when video ends
          player.on("ended", () => {
            const duration = player.duration();
            if (typeof duration === "number" && duration > 0) {
              const progress: VideoProgress = {
                videoId,
                courseId,
                currentTime: duration,
                duration,
                isCompleted: true,
                lastWatched: Date.now(),
              };

              saveVideoProgress(progress);
              setSavedProgress(progress);
            }
          });
        });

        playerRef.current = player;
      }
    }

    return () => {
      if (!isOpen && playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      // Clear progress save timeout
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
        progressSaveTimeoutRef.current = null;
      }
    };
  }, [isOpen, availableQualities]);

  // Update video source when quality changes
  useEffect(() => {
    if (playerRef.current && currentVideoUrl) {
      const currentTime = playerRef.current.currentTime();
      const wasPaused = playerRef.current.paused();

      playerRef.current.src({
        src: currentVideoUrl,
        type: currentVideoUrl.includes(".m3u8")
          ? "application/x-mpegURL"
          : "video/mp4",
      });

      // Restore playback position and state
      playerRef.current.ready(() => {
        if (currentTime && currentTime > 0 && playerRef.current) {
          playerRef.current.currentTime(currentTime);
        }
        if (!wasPaused && playerRef.current) {
          playerRef.current.play();
        }
      });
    }
  }, [currentVideoUrl]);

  // Update playback speed when state changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate(playbackSpeed);
    }
  }, [playbackSpeed]);

  // Add keyboard event listener for fullscreen and skip controls when dialog is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (!playerRef.current) return;

      // Fullscreen toggle with 'f' key
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (playerRef.current.isFullscreen()) {
          playerRef.current.exitFullscreen();
        } else {
          playerRef.current.requestFullscreen();
        }
      }

      // Play/pause toggle with spacebar
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        if (playerRef.current.paused()) {
          playerRef.current.play();
        } else {
          playerRef.current.pause();
        }
      }

      // Decrease playback speed with Shift+, (Shift+<)
      if (event.key === "<" && event.shiftKey) {
        event.preventDefault();
        const currentRate = playerRef.current.playbackRate();
        if (typeof currentRate === "number") {
          const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const currentIndex = speeds.findIndex(
            (speed) => Math.abs(speed - currentRate) < 0.01
          );
          if (currentIndex > 0) {
            const newSpeed = speeds[currentIndex - 1];
            playerRef.current.playbackRate(newSpeed);
            setPlaybackSpeed(newSpeed);
            savePlaybackSpeed(newSpeed);
          }
        }
      }

      // Increase playback speed with Shift+. (Shift+>)
      if (event.key === ">" && event.shiftKey) {
        event.preventDefault();
        const currentRate = playerRef.current.playbackRate();
        if (typeof currentRate === "number") {
          const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const currentIndex = speeds.findIndex(
            (speed) => Math.abs(speed - currentRate) < 0.01
          );
          if (currentIndex >= 0 && currentIndex < speeds.length - 1) {
            const newSpeed = speeds[currentIndex + 1];
            playerRef.current.playbackRate(newSpeed);
            setPlaybackSpeed(newSpeed);
            savePlaybackSpeed(newSpeed);
          }
        }
      }

      // Skip forward 10 seconds with right arrow key
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const currentTime = playerRef.current.currentTime();
        const duration = playerRef.current.duration();
        if (typeof currentTime === "number" && typeof duration === "number") {
          const newTime = Math.min(currentTime + 10, duration);
          playerRef.current.currentTime(newTime);
        }
      }

      // Skip backward 10 seconds with left arrow key
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const currentTime = playerRef.current.currentTime();
        if (typeof currentTime === "number") {
          const newTime = Math.max(currentTime - 10, 0);
          playerRef.current.currentTime(newTime);
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isOpen]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen && playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  }, [isOpen]);

  if (isVideoLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[80vw] !max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Skeleton className="h-4 w-64" />
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !videoData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[80vw] !max-w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Error Loading Video</span>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Failed to load video details
              </p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] !max-w-[80vw]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            <div className="flex items-center justify-between">
              <span>{videoData?.data?.Title || videoTitle}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {videoData.data.download_link ? (
            <>
              <video
                ref={videoRef}
                className="video-js vjs-default-skin w-full h-full"
                data-setup="{}"
              />

              {/* Custom Quality Selector */}
              {availableQualities.length > 1 && (
                <div className="absolute top-4 right-4 z-10">
                  <Select
                    value={selectedQuality}
                    onValueChange={setSelectedQuality}
                  >
                    <SelectTrigger className="w-[100px] bg-black/80 text-white border-white/20">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 text-white border-white/20">
                      {availableQualities.map((quality) => (
                        <SelectItem
                          key={quality.quality}
                          value={quality.quality}
                          className="text-white hover:bg-white/20"
                        >
                          {quality.quality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p>No video source available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export utility functions for use in other components
export { isVideoWatched, getVideoProgress, formatTime };
