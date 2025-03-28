import React, { useRef, useMemo, useState } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { useTheme } from "next-themes";
import { formatDistance } from "date-fns";
import { Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useWindowSize } from "@/lib/hooks/useWindowSize";

// Reuse the Job interface from existing components
interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  poster: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface VirtualizedJobListProps {
  jobs: Job[];
  onDeleteJob: (jobId: string) => void;
  userRole?: string;
}

export function VirtualizedJobList({
  jobs,
  onDeleteJob,
  userRole = "CLIENT",
}: VirtualizedJobListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { theme } = useTheme();
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  // Use our new window size hook
  const windowSize = useWindowSize();

  // Calculate responsive grid dimensions
  // Use ResizeObserver to get accurate container width
  React.useEffect(() => {
    if (!containerRef.current) return;

    // Function to update container width
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width);
      }
    };

    // Initialize container width
    updateWidth();

    // Set up ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [containerRef, windowSize]); // Re-run when window size changes

  // Calculate columns based on container width
  const columnsCount = useMemo(() => {
    if (containerWidth < 640) return 1; // Mobile: 1 column
    if (containerWidth < 1024) return 2; // Tablet: 2 columns
    return 3; // Desktop: 3 columns
  }, [containerWidth]);

  // Calculate row height - can be adjusted based on content
  const rowHeight = 300; // Fixed height for each job card

  // Calculate rows needed
  const rowsCount = Math.ceil(jobs.length / columnsCount);

  // Calculate total height based on rows (with a maximum height)
  const totalHeight = Math.min(rowsCount * rowHeight, windowSize.height * 0.8);

  // Memoize the Cell component to prevent unnecessary re-renders
  const Cell = React.memo(
    ({
      columnIndex,
      rowIndex,
      style,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }) => {
      const index = rowIndex * columnsCount + columnIndex;

      // Return empty div if index is out of bounds
      if (index >= jobs.length) {
        return <div style={style} />;
      }

      const job = jobs[index];

      return (
        <div style={{ ...style, padding: "8px" }}>
          <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden transition-all hover:shadow-md">
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {job.title}
                </h3>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    job.status === "PLANNING"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : job.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : job.status === "ON_HOLD"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : job.status === "COMPLETED"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {job.status === "PLANNING"
                    ? "Planning"
                    : job.status === "IN_PROGRESS"
                    ? "In Progress"
                    : job.status === "ON_HOLD"
                    ? "On Hold"
                    : job.status === "COMPLETED"
                    ? "Completed"
                    : "Cancelled"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {job.description}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{job.location}</span>
                  <span>•</span>
                  <span>
                    Posted{" "}
                    {formatDistance(new Date(job.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border mt-auto">
              <div className="flex justify-between">
                {userRole === "ADMIN" ? (
                  // Admin actions
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-primary"
                    >
                      <Link href={`/jobs/${job.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setJobToDelete(job.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this job posting. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setJobToDelete(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (jobToDelete) {
                                onDeleteJob(jobToDelete);
                                setJobToDelete(null);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  // Client actions
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-primary hover:text-primary hover:bg-primary/5"
                    >
                      <Link href={`/jobs/edit/${job.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Job</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this job posting. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setJobToDelete(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (jobToDelete) {
                                onDeleteJob(jobToDelete);
                                setJobToDelete(null);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  );

  // For better debugging
  Cell.displayName = "JobCell";

  // Only render the grid if we have jobs and a valid container width
  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {jobs.length > 0 && containerWidth > 0 ? (
        <Grid
          columnCount={columnsCount}
          columnWidth={containerWidth / columnsCount}
          height={totalHeight}
          rowCount={rowsCount}
          rowHeight={rowHeight}
          width={containerWidth}
          // Add overscan for smoother scrolling
          overscanRowCount={1}
          // Add className for styling
          className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
        >
          {Cell}
        </Grid>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No jobs found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search or post a new job.
          </p>
        </div>
      ) : (
        <div className="h-96 bg-muted animate-pulse rounded"></div>
      )}
    </div>
  );
}
