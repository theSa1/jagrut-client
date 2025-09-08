import { fetchCourses } from "@/lib/apis";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

const CourseCard = ({
  course,
}: {
  course: Awaited<ReturnType<typeof fetchCourses>>["data"][0];
}) => (
  <Link to="/course/$courseId" params={{ courseId: course.itemid }}>
    <Card>
      <div className="aspect-video overflow-hidden mx-6 rounded-lg">
        <img
          src={course.coursedt[0].course_thumbnail}
          alt={course.coursedt[0].course_name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader>
        <CardTitle>{course.coursedt[0].course_name}</CardTitle>
        <CardDescription
          className="text-muted-foreground line-clamp-3 mb-4 *:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: course.coursedt[0].course_description,
          }}
        />
      </CardHeader>
    </Card>
  </Link>
);

const CourseSkeleton = () => (
  <Card className="h-full">
    <Skeleton className="aspect-video w-full rounded-t-lg" />
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
);

const Page = () => {
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  if (courses.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (courses.error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-lg mb-2">
          Failed to load courses
        </div>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    );
  }

  const coursesData = courses.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground">
          Continue your learning journey with {coursesData.length} enrolled
          course{coursesData.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Courses Grid */}
      {coursesData.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No courses yet
          </h3>
          <p className="text-muted-foreground">
            Start your learning journey by enrolling in a course
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesData.map((course) => (
            <CourseCard key={course.purchaseid} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute("/_authenticated/")({
  component: Page,
});
