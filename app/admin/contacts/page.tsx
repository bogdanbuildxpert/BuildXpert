"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Define the Contact type
type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "NEW" | "REVIEWED" | "RESPONDED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

// Define the pagination type
type Pagination = {
  total: number;
  pages: number;
  page: number;
  limit: number;
};

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseData, setResponseData] = useState({
    contactId: "",
    contactName: "",
    contactEmail: "",
    responseSubject: "",
    responseMessage: "",
  });
  const [sendingResponse, setSendingResponse] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch contacts
  const fetchContacts = async (page = 1, status: string | null = null) => {
    try {
      setLoading(true);
      let url = `/api/admin/contacts?page=${page}`;
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();
      setContacts(data.contacts);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update contact status
  const updateContactStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update contact status");
      }

      // Refresh contacts
      fetchContacts(pagination.page, statusFilter);
    } catch (error) {
      console.error("Error updating contact status:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchContacts(1, statusFilter);
    }
  }, [status, session, statusFilter]);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "ALL" ? null : value);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchContacts(page, statusFilter);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500";
      case "REVIEWED":
        return "bg-yellow-500";
      case "RESPONDED":
        return "bg-green-500";
      case "ARCHIVED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Handle sending response email
  const handleSendResponse = async () => {
    if (!responseData.responseMessage) {
      toast.error("Please enter a response message");
      return;
    }

    try {
      setSendingResponse(true);
      const response = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: responseData.contactId,
          responseSubject: responseData.responseSubject,
          responseMessage: responseData.responseMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Response email sent successfully");
        setResponseDialogOpen(false);
        // Reset response form
        setResponseData({
          contactId: "",
          contactName: "",
          contactEmail: "",
          responseSubject: "",
          responseMessage: "",
        });
        // Refresh contacts to update status
        fetchContacts(pagination.page, statusFilter);
      } else {
        toast.error(data.error || "Failed to send response email");
      }
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error("An error occurred while sending the response");
    } finally {
      setSendingResponse(false);
    }
  };

  // Open response dialog
  const openResponseDialog = (contact: Contact) => {
    setResponseData({
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      responseSubject: `Re: Your inquiry to BuildXpert`,
      responseMessage: `Dear ${
        contact.name.split(" ")[0]
      },\n\nThank you for your message. \n\n`,
    });
    setResponseDialogOpen(true);
  };

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.role !== "ADMIN")
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contact Form Submissions</CardTitle>
              <CardDescription>
                Manage and respond to contact form submissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={statusFilter || "ALL"}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESPONDED">Responded</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No contact submissions found
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {contact.message}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(contact.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={contact.status}
                            onValueChange={(value) =>
                              updateContactStatus(contact.id, value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">New</SelectItem>
                              <SelectItem value="REVIEWED">Reviewed</SelectItem>
                              <SelectItem value="RESPONDED">
                                Responded
                              </SelectItem>
                              <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResponseDialog(contact)}
                          >
                            Reply
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, pagination.page - 1))
                          }
                          className={
                            pagination.page <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: pagination.pages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={pagination.page === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(pagination.pages, pagination.page + 1)
                            )
                          }
                          className={
                            pagination.page >= pagination.pages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Respond to Contact</DialogTitle>
            <DialogDescription>
              Send an email response to {responseData.contactName} (
              {responseData.contactEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="responseSubject">Subject</Label>
              <Input
                id="responseSubject"
                value={responseData.responseSubject}
                onChange={(e) =>
                  setResponseData({
                    ...responseData,
                    responseSubject: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responseMessage">Message</Label>
              <Textarea
                id="responseMessage"
                value={responseData.responseMessage}
                onChange={(e) =>
                  setResponseData({
                    ...responseData,
                    responseMessage: e.target.value,
                  })
                }
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResponseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendResponse} disabled={sendingResponse}>
              {sendingResponse ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
