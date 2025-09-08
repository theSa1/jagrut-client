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
import { FileText, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";
import { useState } from "react";
import { ContentSkeleton, FolderList } from "./$folderId";

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
        <div className="text-destructive text-lg mb-2">
          Failed to load course
        </div>
        <p className="text-muted-foreground">Please try refreshing the page</p>
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
            <h1 className="text-3xl font-bold text-foreground">
              {courseData?.course_name}
            </h1>
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
                className="text-foreground prose prose-sm max-w-none"
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
          <h2 className="text-xl font-semibold text-foreground">
            Course Contents
          </h2>
          <Badge variant="outline">
            {contentData.length} item{contentData.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {contentData.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No content available
              </h3>
              <p className="text-muted-foreground">
                This course doesn't have any content yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <FolderList
            folderData={contentData}
            courseId={courseId!}
            onVideoClick={handleVideoClick}
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

export const Route = createFileRoute("/_authenticated/course/$courseId/")({
  component: Page,
});
