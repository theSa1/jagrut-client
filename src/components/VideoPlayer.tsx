import React, { useEffect, useState } from "react";
import "video.js/dist/video-js.css";
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
import ReactPlayer from "react-player";
import { decrypt } from "@/lib/decrypt";

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
  const [availableQualities, setAvailableQualities] = useState<
    Array<{
      quality: string;
      bitrate: number;
      url: string;
    }>
  >([]);

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
        videoData.data.download_links.map((l) => ({
          quality: l.quality,
          bitrate: parseInt(l.quality.replace("p", "")),
          url: decrypt(l.path),
        })) || []
      );
    }
  }, [videoData]);

  const currentVideoUrl =
    selectedQuality === "auto"
      ? availableQualities[0]?.url
      : availableQualities.find((q) => q.quality === selectedQuality)?.url ||
        availableQualities[0]?.url;

  if (isVideoLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Skeleton className="h-4 w-64" />
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !videoData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Error Loading Video</span>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load video details</p>
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
      <DialogContent className="w-[80vw] sm:max-w-max">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {videoData?.data?.Title || videoTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {videoData.data.download_link ? (
            <>
              <ReactPlayer
                src={currentVideoUrl}
                controls
                autoPlay
                className="w-full h-full"
                style={{ width: "100%", height: "100%" }}
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
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>No video source available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
