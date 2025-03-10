import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | BuildXpert",
  description: "View and manage construction projects - Admin Only",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
