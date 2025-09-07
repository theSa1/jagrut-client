import { fetchFolderContents, fetchParentFolders } from "@/lib/apis";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useState } from "react";
import { decrypt } from "@/lib/decrypt";

const ContentItem = ({
  item,
  courseId,
  onVideoClick,
}: {
  item: any;
  courseId: string;
  onVideoClick: (videoId: string, videoTitle: string) => void;
}) => {
  const getIcon = () => {
    switch (item.material_type) {
      case "FOLDER":
        return <Folder className="h-5 w-5 text-blue-600" />;
      case "VIDEO":
        return <Play className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBadgeColor = () => {
    switch (item.material_type) {
      case "FOLDER":
        return "bg-blue-100 text-blue-800";
      case "VIDEO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (item.material_type === "FOLDER") {
    return (
      <Link
        to="/course/$courseId/$folderId"
        params={{ courseId: courseId, folderId: item.id }}
        className="group block"
      >
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.Title}
                  </h3>
                  <p className="text-sm text-gray-500">Folder</p>
                </div>
              </div>
              <Badge className={getBadgeColor()}>{item.material_type}</Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (item.material_type === "VIDEO") {
    return (
      <Card
        className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-green-500 cursor-pointer"
        onClick={() => onVideoClick(item.id, item.Title)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <h3 className="font-medium text-gray-900 hover:text-green-600 transition-colors">
                  {item.Title}
                </h3>
                <p className="text-sm text-gray-500">Video</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getBadgeColor()}>{item.material_type}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="border-l-4 border-l-gray-300"
      onClick={() => {
        if (item.material_type === "PDF" && item.download_link) {
          window.open(decrypt(item.download_link), "_blank");
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <h3 className="font-medium text-gray-900">{item.Title}</h3>
              <p className="text-sm text-gray-500">{item.material_type}</p>
            </div>
          </div>
          <Badge className={getBadgeColor()}>{item.material_type}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const ContentSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-5" />
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardContent>
  </Card>
);

const Page = () => {
  const { courseId, folderId } = Route.useParams();
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    videoTitle: string;
  } | null>(null);

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
        <div className="text-red-500 text-lg mb-2">Failed to load folder</div>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  const folderData = folder.data?.data || [];
  const parentData = parentFolders.data?.data || [];
  const currentFolderName =
    parentData.length > 0
      ? parentData[parentData.length - 1]?.title
      : "Course Root";
  const parentFolderId = parentData.length > 0 ? parentData[0]?.id : courseId;

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
          {parentData.length > 1 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>...</BreadcrumbPage>
              </BreadcrumbItem>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FolderOpen className="h-8 w-8 mr-3 text-blue-600" />
              {currentFolderName}
            </h1>
            <Badge variant="secondary" className="w-fit">
              <Folder className="h-3 w-3 mr-1" />
              Folder
            </Badge>
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
              Back to {parentData[0]?.title || "Course"}
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Folder Contents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Folder Contents
          </h2>
          <Badge variant="outline">
            {folderData.length} item{folderData.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {folderData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Empty folder
              </h3>
              <p className="text-gray-600">
                This folder doesn't contain any items yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {folderData.map((item: any) => (
              <ContentItem
                key={item.id}
                item={item}
                courseId={courseId!}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
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

export const Route = createFileRoute("/_authenticated/course/$courseId/$folderId")({
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
