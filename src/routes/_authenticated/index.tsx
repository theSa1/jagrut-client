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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, Users } from "lucide-react";

const CourseCard = ({ course }: { course: any }) => (
  <Link
    to="/course/$courseId"
    params={{ courseId: course.itemid }}
    className="group block"
  >
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={course.coursedt[0].course_thumbnail}
          alt={course.coursedt[0].course_name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-700">
            <BookOpen className="h-3 w-3 mr-1" />
            Course
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.coursedt[0].course_name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription
          className="text-gray-600 line-clamp-3 mb-4"
          dangerouslySetInnerHTML={{
            __html: course.coursedt[0].course_description,
          }}
        />

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Self-paced</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>Enrolled</span>
            </div>
          </div>
        </div>
      </CardContent>
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
        <div className="text-red-500 text-lg mb-2">Failed to load courses</div>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  const coursesData = courses.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">
          Continue your learning journey with {coursesData.length} enrolled
          course{coursesData.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Courses Grid */}
      {coursesData.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses yet
          </h3>
          <p className="text-gray-600">
            Start your learning journey by enrolling in a course
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesData.map((course: any) => (
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
