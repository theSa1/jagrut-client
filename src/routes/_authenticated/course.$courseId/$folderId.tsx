import { fetchFolderContents, fetchParentFolders } from "@/lib/apis";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Folder,
  FileText,
  Play,
  ArrowLeft,
  BookOpen,
  FolderOpen,
  FileImage,
  File,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VideoPlayer,
  getVideoProgress,
  formatTime,
} from "@/components/video-player";
import { useEffect, useState } from "react";
import { decrypt } from "@/lib/decrypt";

export const FolderItem = ({
  item,
  courseId,
  onVideoClick,
  refreshTrigger,
}: {
  item: Awaited<ReturnType<typeof fetchFolderContents>>["data"][0];
  courseId: string;
  onVideoClick: (videoId: string, videoTitle: string) => void;
  refreshTrigger?: number;
}) => {
  const navigate = useNavigate();
  const [videoProgress, setVideoProgress] = useState(
    item.material_type === "VIDEO" ? getVideoProgress(item.id, courseId) : null
  );

  useEffect(() => {
    if (item.material_type === "VIDEO") {
      setVideoProgress(getVideoProgress(item.id, courseId));
    }
  }, [refreshTrigger, item.id, courseId]);

  const Icon =
    item.material_type === "FOLDER" ? (
      <Folder className="h-5 w-5 text-primary" />
    ) : item.material_type === "VIDEO" ? (
      videoProgress?.isCompleted ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <Play className="h-5 w-5 text-primary" />
      )
    ) : item.material_type === "PDF" ? (
      <FileText className="h-5 w-5 text-destructive" />
    ) : item.material_type === "IMAGE" ? (
      <FileImage className="h-5 w-5 text-primary" />
    ) : (
      <File className="h-5 w-5 text-muted-foreground" />
    );

  const getVideoProgressInfo = () => {
    if (item.material_type !== "VIDEO" || !videoProgress) return null;

    if (videoProgress.isCompleted) {
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-green-100 text-green-800"
        >
          ✓ Completed
        </Badge>
      );
    }

    if (videoProgress.currentTime > 10) {
      const progressPercent = Math.round(
        (videoProgress.currentTime / videoProgress.duration) * 100
      );
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {progressPercent}%
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTime(videoProgress.currentTime)} /{" "}
            {formatTime(videoProgress.duration)}
          </span>
        </div>
      );
    }

    return null;
  };

  const handleClick = () => {
    if (item.material_type === "FOLDER") {
      navigate({
        to: "/course/$courseId/$folderId",
        params: { courseId, folderId: item.id },
      });
    } else if (item.material_type === "VIDEO") {
      onVideoClick(item.id, item.Title);
    } else if (item.material_type === "PDF" && item.download_link) {
      window.open(decrypt(item.download_link), "_blank");
    }
  };

  const cardContent = (
    <div className="cursor-pointer p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {Icon}
          <div className="flex-1">
            <h3 className="font-medium text-foreground transition-colors">
              {item.Title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date(item.event_date).toLocaleString("en-IN")}
            </p>
            {getVideoProgressInfo()}
          </div>
        </div>
      </div>
    </div>
  );

  return <div onClick={handleClick}>{cardContent}</div>;
};

export const ContentSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="h-10 w-10 rounded-md" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-2 w-1/2" />
    </div>
  </div>
);

export const FolderList = ({
  folderData,
  courseId,
  onVideoClick,
  refreshTrigger,
}: {
  folderData: Awaited<ReturnType<typeof fetchFolderContents>>["data"];
  courseId: string;
  onVideoClick: (videoId: string, videoTitle: string) => void;
  refreshTrigger?: number;
}) => {
  return (
    <div className="space-y-3">
      {folderData.map((item) => (
        <FolderItem
          key={`${item.id}-${refreshTrigger}`}
          item={item}
          courseId={courseId}
          onVideoClick={onVideoClick}
          refreshTrigger={refreshTrigger}
        />
      ))}
    </div>
  );
};

const Page = () => {
  const { courseId, folderId } = Route.useParams();
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    videoTitle: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render to update progress

  const folder = useQuery({
    queryKey: ["folder", courseId, folderId],
    queryFn: () => fetchFolderContents(folderId!, courseId!),
  });
  const parentFolders = useQuery({
    queryKey: ["parentFolders", courseId, folderId],
    queryFn: () => fetchParentFolders(folderId!, courseId!),
  });

  const handleVideoClick = (videoId: string, videoTitle: string) => {
    setSelectedVideo({ videoId, videoTitle });
  };

  const handleVideoClose = () => {
    setSelectedVideo(null);
    setRefreshKey((prev) => prev + 1); // Force re-render to update video progress
  };

  if (folder.isLoading || parentFolders.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-8 w-64" />
        </div>

        <Separator />

        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContentSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (folder.error || parentFolders.error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-lg mb-2">
          Failed to load folder
        </div>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  const folderData = folder.data?.data || [];
  const parentData = parentFolders.data?.parent;
  const currentFolderName = parentFolders.data?.current?.Title || "Folder";
  const parentFolderId = parentData?.id ?? courseId;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                Courses
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/course/$courseId" params={{ courseId }}>
                Course
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {parentData && parentData.id !== courseId && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>...</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {parentData && parentData.id !== courseId && (
            <>
              <BreadcrumbSeparator />
              <Link
                to="/course/$courseId/$folderId"
                params={{ courseId, folderId: parentData.id }}
              >
                <BreadcrumbPage className="flex items-center">
                  <FolderOpen className="h-4 w-4 mr-1" />
                  {parentData.title}
                </BreadcrumbPage>
              </Link>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center">
              <FolderOpen className="h-4 w-4 mr-1" />
              {currentFolderName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Folder Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <FolderOpen className="h-8 w-8 mr-3 text-primary" />
              {currentFolderName}
            </h1>
          </div>

          <Button variant="outline" asChild>
            <Link
              to="/course/$courseId/$folderId"
              params={{
                courseId,
                folderId: parentFolderId || courseId!,
              }}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Folder Contents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Folder Contents
          </h2>
          <Badge variant="outline">
            {folderData.length} item{folderData.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {folderData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Empty folder
              </h3>
              <p className="text-muted-foreground">
                This folder doesn't contain any items yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <FolderList
            key={refreshKey}
            folderData={folderData}
            courseId={courseId!}
            onVideoClick={handleVideoClick}
            refreshTrigger={refreshKey}
          />
        )}
      </div>

      {/* Video Player Dialog */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          courseId={courseId!}
          videoTitle={selectedVideo.videoTitle}
          isOpen={!!selectedVideo}
          onClose={handleVideoClose}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute(
  "/_authenticated/course/$courseId/$folderId"
)({
  component: Page,
  beforeLoad: ({ params }) => {
    if (params.folderId === params.courseId) {
      throw redirect({
        to: "/course/$courseId",
        params: { courseId: params.courseId },
      });
    }
  },
});
