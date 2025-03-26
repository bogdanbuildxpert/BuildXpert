import { prisma } from "@/lib/prisma";
import { removeFromSuppressionList } from "@/lib/services/email-bounce";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BouncesPage() {
  const bounces = await prisma.emailBounce.findMany({
    orderBy: { timestamp: "desc" },
    take: 100, // Limit to most recent 100 for performance
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Email Bounce Management</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">About Email Bounces</h2>
        <p className="mb-2">
          This page shows emails that have bounced when sending from your
          application.
        </p>
        <ul className="list-disc list-inside mb-2 ml-4 text-sm">
          <li>
            <span className="font-semibold">Hard bounces</span> indicate
            permanent failures (invalid address, domain doesn't exist, etc.)
          </li>
          <li>
            <span className="font-semibold">Soft bounces</span> are temporary
            issues (mailbox full, server temporarily down, etc.)
          </li>
        </ul>
        <p className="text-sm">
          Hard bounces are automatically added to a suppression list to prevent
          future sending attempts.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bounces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No bounced emails found
                </TableCell>
              </TableRow>
            ) : (
              bounces.map((bounce) => (
                <TableRow key={bounce.id}>
                  <TableCell>{bounce.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bounce.bounceType === "HARD"
                          ? "bg-red-100 text-red-800"
                          : bounce.bounceType === "SOFT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {bounce.bounceType}
                    </span>
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate"
                    title={bounce.reason || "Unknown"}
                  >
                    {bounce.reason || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bounce.status === "NEW"
                          ? "bg-blue-100 text-blue-800"
                          : bounce.status === "PROCESSED"
                          ? "bg-green-100 text-green-800"
                          : bounce.status === "IGNORED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {bounce.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(bounce.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <form
                      action={async () => {
                        "use server";
                        if (bounce.bounceType === "HARD") {
                          await removeFromSuppressionList(bounce.email);
                        } else {
                          await prisma.emailBounce.update({
                            where: { id: bounce.id },
                            data: { status: "RESOLVED" },
                          });
                        }
                      }}
                    >
                      <Button variant="outline" type="submit" size="sm">
                        {bounce.bounceType === "HARD"
                          ? "Remove from Suppression"
                          : "Mark Resolved"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
