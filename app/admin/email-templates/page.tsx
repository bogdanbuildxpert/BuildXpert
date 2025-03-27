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
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Eye, Save } from "lucide-react";
import Image from "next/image";

// Define the EmailTemplate type
type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function EmailTemplatesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState({
    id: "",
    subject: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If authentication is done loading and user is not admin, redirect
    if (!isLoading && isAuthenticated) {
      if (user?.role !== "ADMIN" && user?.role !== "admin") {
        toast.error("You don't have permission to access this page");
        router.push("/");
      } else {
        fetchTemplates();
      }
    } else if (!isLoading && !isAuthenticated) {
      // If not authenticated and not loading, redirect to login
      toast.error("Please login to access this page");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch email templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/email-templates", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Error loading email templates");
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({
      id: template.id,
      subject: template.subject,
      content: template.content,
    });
    setEditDialogOpen(true);
  };

  // Open preview dialog
  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!editedTemplate.subject || !editedTemplate.content) {
      toast.error("Subject and content are required");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/email-templates/${editedTemplate.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: editedTemplate.subject,
            content: editedTemplate.content,
          }),
          credentials: "include", // Important for cookies
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Email template updated successfully");
        setEditDialogOpen(false);
        // Refresh templates
        fetchTemplates();
      } else {
        toast.error(data.error || "Failed to update email template");
      }
    } catch (error) {
      console.error("Error updating email template:", error);
      toast.error("An error occurred while updating the template");
    } finally {
      setSaving(false);
    }
  };

  // Format template name for display
  const formatTemplateName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render preview of email content
  const renderEmailPreview = () => {
    if (!selectedTemplate) return null;

    // Create a layout similar to the actual email
    return (
      <div className="bg-white p-6 rounded-md shadow-sm max-h-[70vh] overflow-auto">
        <div className="border-b pb-4 mb-4 text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/favicon.svg"
              alt="BuildXpert Logo"
              width={40}
              height={40}
              className="inline-block"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800">BuildXpert</h1>
        </div>
        <div
          className="py-4"
          dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
        />
        <div className="border-t pt-4 mt-4 text-center text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} BuildXpert. All rights reserved.
          </p>
          <p>123 Construction Ave, Dublin, Ireland</p>
          <p>
            This is a transactional email related to your interaction with
            BuildXpert.
          </p>
        </div>
      </div>
    );
  };

  if (isLoading || loading) {
    return <div className="container py-8">Loading email templates...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Email Templates</h1>

      {templates.length === 0 ? (
        <p>No email templates found.</p>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() =>
                router.push(`/admin/email-templates/${template.id}`)
              }
            >
              <h2 className="text-xl font-semibold">{template.name}</h2>
              <p className="text-gray-600 text-sm mt-1">
                Last updated: {new Date(template.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {selectedTemplate
                ? formatTemplateName(selectedTemplate.name)
                : ""}{" "}
              Template
            </DialogTitle>
            <DialogDescription>
              Customize the email template. Use placeholders like {"{{name}}"}{" "}
              that will be replaced with actual values.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={editedTemplate.subject}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        subject: e.target.value,
                      })
                    }
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Email Content (HTML)</Label>
                  <Textarea
                    id="content"
                    value={editedTemplate.content}
                    onChange={(e) =>
                      setEditedTemplate({
                        ...editedTemplate,
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter email content in HTML format"
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">
                    Available Placeholders:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedTemplate?.name === "contact_confirmation" && (
                      <>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{name}}"} - Customer&apos;s name
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{subject}}"} - Message subject
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{date}}"} - Current date
                        </div>
                      </>
                    )}
                    {selectedTemplate?.name === "contact_notification" && (
                      <>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{name}}"} - Customer&apos;s name
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{email}}"} - Customer&apos;s email
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{phone}}"} - Customer&apos;s phone
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{subject}}"} - Message subject
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{message}}"} - Message content
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{preferredContact}}"} - Preferred contact method
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{date}}"} - Current date
                        </div>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{adminUrl}}"} - Admin dashboard URL
                        </div>
                      </>
                    )}
                    {selectedTemplate?.name === "email_verification" && (
                      <>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{verificationLink}}"} - Email verification link
                        </div>
                      </>
                    )}
                    {selectedTemplate?.name === "password_reset" && (
                      <>
                        <div className="bg-gray-100 p-1 rounded">
                          {"{{resetLink}}"} - Password reset link
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="py-4">
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Subject:</h3>
                <p className="text-sm bg-gray-50 p-2 rounded mb-4">
                  {editedTemplate.subject}
                </p>

                <h3 className="text-sm font-medium mb-2">Content:</h3>
                <div className="bg-white border rounded-md p-4 max-h-[400px] overflow-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: editedTemplate.content }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
              {!saving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate
                ? formatTemplateName(selectedTemplate.name)
                : ""}{" "}
              Template Preview
            </DialogTitle>
            <DialogDescription>
              This is how the email will look when sent to users
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="text-sm font-medium mb-2">Subject:</h3>
            <p className="text-sm bg-gray-50 p-2 rounded mb-4">
              {selectedTemplate?.subject}
            </p>

            <h3 className="text-sm font-medium mb-2">Content:</h3>
            {renderEmailPreview()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                openEditDialog(selectedTemplate!);
              }}
            >
              Edit Template
              <Pencil className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
