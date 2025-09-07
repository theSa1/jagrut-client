import { fetchCourseDetails, fetchFolderContents } from "@/lib/apis";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Folder, FileText, Play, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useState } from "react";

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
    <Card className="border-l-4 border-l-gray-300">
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
  const { courseId } = Route.useParams();
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    videoTitle: string;
  } | null>(null);

  const course = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourseDetails(courseId!),
  });
  const courseFolder = useQuery({
    queryKey: ["courseFolder", courseId, courseId],
    queryFn: () => fetchFolderContents(courseId!, courseId!),
  });

  const handleVideoClick = (videoId: string, videoTitle: string) => {
    setSelectedVideo({ videoId, videoTitle });
  };

  const handleVideoClose = () => {
    setSelectedVideo(null);
  };

  if (course.isLoading || courseFolder.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-20 w-full" />
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

  if (course.error || courseFolder.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">Failed to load course</div>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  const courseData = course.data?.data[0];
  const contentData = courseFolder.data?.data || [];

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
            <BreadcrumbPage>{courseData?.course_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Course Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {courseData?.course_name}
            </h1>
            <Badge variant="secondary" className="w-fit">
              <BookOpen className="h-3 w-3 mr-1" />
              Course
            </Badge>
          </div>

          <Button variant="outline" asChild>
            <Link to="/" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>

        {courseData?.course_description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About this course</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: courseData.course_description,
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Course Contents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Course Contents
          </h2>
          <Badge variant="outline">
            {contentData.length} item{contentData.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {contentData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No content available
              </h3>
              <p className="text-gray-600">
                This course doesn't have any content yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contentData.map((item: any) => (
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

export const Route = createFileRoute("/_authenticated/course/$courseId/")({
  component: Page,
});
