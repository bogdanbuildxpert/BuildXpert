"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { Trash, Phone, Mail, MessageSquare } from "lucide-react";
import { fetchAuthAPI } from "@/lib/fetch-utils";
import { signOut } from "next-auth/react";

// Define the Contact type
type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact: "EMAIL" | "PHONE";
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
  const { user, isLoading } = useAuth();
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
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseData, setResponseData] = useState({
    contactId: "",
    contactName: "",
    contactEmail: "",
    responseSubject: "",
    responseMessage: "",
  });
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({
    name: "",
    message: "",
  });
  const [sendingResponse, setSendingResponse] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN" && user.role !== "admin") {
        router.push("/");
      }
    }
  }, [isLoading, user, router]);

  // Fetch contacts
  const fetchContacts = async (page = 1, status: string | null = null) => {
    try {
      setLoading(true);
      let url = `/api/admin/contacts?page=${page}`;
      if (status) {
        url += `&status=${status}`;
      }

      const data = await fetchAuthAPI<{
        contacts: Contact[];
        pagination: Pagination;
      }>(url);

      setContacts(data.contacts);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching contacts:", error);

      // Check if this is an authentication error
      const errorMessage = (error as Error).message || "";
      if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("401")
      ) {
        toast.error("Your session has expired. Please log in again.");
        // Sign out and redirect to login
        await signOut({
          redirect: true,
          callbackUrl: `/login?from=${encodeURIComponent(
            window.location.pathname
          )}`,
        });
      } else {
        toast.error("Failed to load contacts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update contact status
  const updateContactStatus = async (id: string, status: string) => {
    try {
      await fetchAuthAPI("/api/admin/contacts", {
        method: "PATCH",
        body: { id, status },
      });

      // Refresh contacts
      fetchContacts(pagination.page, statusFilter);
      toast.success("Contact status updated");
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast.error("Failed to update contact status");
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchContacts(1, statusFilter);
    }
  }, [user, statusFilter]);

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
      await fetchAuthAPI("/api/admin/contacts", {
        method: "POST",
        body: {
          contactId: responseData.contactId,
          responseSubject: responseData.responseSubject,
          responseMessage: responseData.responseMessage,
        },
      });

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

  // Handle contact deletion
  const handleDeleteContact = async (id: string) => {
    try {
      setIsDeleting(true);
      setDeletingContactId(id);

      // Use fetchAuthAPI with additional error handling
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies with request
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      toast.success(data.message || "Contact deleted successfully");

      // Refresh the contacts list
      fetchContacts(pagination.page, statusFilter);
    } catch (error) {
      console.error("Error deleting contact:", error);

      // Log more details for debugging
      if (error instanceof Error) {
        console.error("Delete error details:", {
          message: error.message,
          name: error.name,
        });
      }

      toast.error(
        (error as Error).message ||
          "An error occurred while deleting the contact"
      );
    } finally {
      setIsDeleting(false);
      setDeletingContactId(null);
    }
  };

  // Open message dialog
  const openMessageDialog = (contact: Contact) => {
    setSelectedMessage({
      name: contact.name,
      message: contact.message,
    });
    setMessageDialogOpen(true);
  };

  if (isLoading || (user && user.role !== "ADMIN")) {
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
                    <TableHead>Preferred</TableHead>
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
                      <TableCell>
                        <div className="flex items-center">
                          {contact.preferredContact === "PHONE" ? (
                            <>
                              <Phone className="h-4 w-4 mr-1 text-blue-500" />
                              <span className="text-xs">Phone</span>
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1 text-blue-500" />
                              <span className="text-xs">Email</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="flex items-center text-left px-2 py-1 hover:bg-slate-100 rounded"
                          onClick={() => openMessageDialog(contact)}
                        >
                          <span className="max-w-xs truncate mr-1">
                            {contact.message}
                          </span>
                          <MessageSquare className="h-4 w-4 ml-1 flex-shrink-0 text-slate-400" />
                        </Button>
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

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Contact
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this contact
                                  submission? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteContact(contact.id)
                                  }
                                  className="bg-red-500 hover:bg-red-600"
                                  disabled={
                                    isDeleting &&
                                    deletingContactId === contact.id
                                  }
                                >
                                  {isDeleting &&
                                  deletingContactId === contact.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Message Viewer Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Message from {selectedMessage.name}</DialogTitle>
            <DialogDescription>Full message content</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
