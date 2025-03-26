"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Shield, Mail, Key, Trash2 } from "lucide-react";
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
import { signOut } from "next-auth/react";
import { useCookiePreferences } from "@/lib/hooks/use-cookie-preferences";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export default function ProfilePage() {
  // Check if we're in the browser environment
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { user, isLoading, login, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const { cookiePreferences, updateCookiePreferences } = useCookiePreferences();
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // If not mounted yet (server-side), return a loading state or minimal content
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-bold">Loading Profile...</h1>
          <p className="text-muted-foreground mt-2">
            Please wait while we load your profile information.
          </p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
      });

      // Check if this is a Google account by making a server request
      const checkGoogleAccount = async () => {
        try {
          const response = await fetch("/api/user/check-google-account", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setIsGoogleAccount(data.isGoogleAccount);
          }
        } catch (error) {
          console.error("Error checking Google account:", error);
        }
      };

      checkGoogleAccount();
    }
  }, [isLoading, user, router]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile-fix", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileData.name,
          email: user.email, // Add email for lookup
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user in context
        login({
          ...user,
          name: profileData.name,
        });

        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setIsChangingPassword(false);
        toast.success("Password changed successfully");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    // Validate confirmation text
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    // For all users, require a password for security
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmText: deleteConfirmation,
          email: user.email, // Include email for better identification
        }),
        credentials: "include", // Include cookies in the request
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account deleted successfully");

        // Clear all cookies and local storage - safely check for browser environment
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");

          // Clear cookies
          const clearCookie = (name: string) => {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          };

          clearCookie("user");
          clearCookie("next-auth.session-token");
          clearCookie("next-auth.callback-url");
          clearCookie("next-auth.csrf-token");

          // For Google accounts, ensure NextAuth signOut is called directly
          if (isGoogleAccount) {
            try {
              // Sign out from NextAuth with a redirect to home page
              await signOut({ callbackUrl: "/" });
            } catch (signOutError) {
              console.error("Error signing out with NextAuth:", signOutError);
              // Still redirect even if sign out fails
              window.location.href = "/";
            }
          } else {
            // For regular accounts, call our logout function and redirect
            logout();
            window.location.href = "/";
          }
        }
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveCookiePreferences = async () => {
    try {
      setIsSavingPreferences(true);
      await updateCookiePreferences(cookiePreferences);
    } catch (error) {
      console.error("Error saving cookie preferences:", error);
      toast.error("Failed to save cookie preferences");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View and update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                    />
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/50">
                      {user.name || (
                        <span className="text-muted-foreground italic flex items-center justify-between">
                          <span>
                            Not set - click Edit Profile to add your name
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="ml-2"
                          >
                            <Link href="/set-name">Set name directly</Link>
                          </Button>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <div className="p-2 border rounded-md bg-muted/50 flex-1">
                      {user.email}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {user.role}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          name: user.name || "",
                          email: user.email || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  {isGoogleAccount
                    ? "Password management is handled by Google for your account"
                    : "Change your password to keep your account secure"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show Google account notice for Google users */}
                {isGoogleAccount ? (
                  <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-600">
                    <p className="flex items-center">
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        className="mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path
                            fill="#4285F4"
                            d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                          />
                          <path
                            fill="#34A853"
                            d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                          />
                          <path
                            fill="#EA4335"
                            d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                          />
                        </g>
                      </svg>
                      Google Account Detected
                    </p>
                    <p className="mt-2">
                      Your password is managed by Google. To change your
                      password, please visit your Google account settings.
                    </p>
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-blue-700 hover:text-blue-900"
                    >
                      Go to Google Account Settings
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                ) : isChangingPassword ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/50">
                    ••••••••••••
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {isChangingPassword ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword} disabled={isSaving}>
                      {isSaving ? "Changing..." : "Change Password"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsChangingPassword(true)}
                    disabled={isGoogleAccount}
                    className={
                      isGoogleAccount ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    Change Password
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* Cookie Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cookie Preferences</CardTitle>
                <CardDescription>
                  Manage how we use cookies to enhance your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="essential" checked disabled />
                  <div className="space-y-1">
                    <Label htmlFor="essential">Essential Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analytics"
                    checked={cookiePreferences.analytics}
                    onCheckedChange={(checked) => {
                      if (typeof checked === "boolean") {
                        updateCookiePreferences({ analytics: checked });
                      }
                    }}
                    disabled={isSavingPreferences}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="analytics">Analytics Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us improve by tracking usage patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preferences"
                    checked={cookiePreferences.preferences}
                    onCheckedChange={(checked) => {
                      if (typeof checked === "boolean") {
                        updateCookiePreferences({ preferences: checked });
                      }
                    }}
                    disabled={isSavingPreferences}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="preferences">Preference Cookies</Label>
                    <p className="text-sm text-muted-foreground">
                      Remember your settings and preferences
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveCookiePreferences}
                  disabled={isSavingPreferences}
                >
                  {isSavingPreferences ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>

            {/* Notification Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification preferences will be available soon.
                </p>
              </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-red-200">
              <CardHeader className="border-b border-red-200">
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Actions that will permanently affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border border-red-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Only show password field for non-Google users */}
            <div className="space-y-2">
              <Label htmlFor="deletePassword" className="text-sm font-medium">
                Enter your password to confirm
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="deleteConfirmation"
                className="text-sm font-medium"
              >
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            {isGoogleAccount && (
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-600">
                <p className="flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    className="mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  Google Account Detected
                </p>
                <p className="mt-2">
                  You're signed in with a Google account. No password is
                  required to delete your account.
                </p>
              </div>
            )}

            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              <p>All of the following will be permanently deleted:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Your account and profile information</li>
                <li>All projects you've created</li>
                <li>All jobs you've posted</li>
                <li>All messages and communications</li>
                <li>All reviews you've given or received</li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
