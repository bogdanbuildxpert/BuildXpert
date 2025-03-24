"use client";

import { useState } from "react";
import { useCookiePreferences } from "@/lib/hooks/use-cookie-preferences";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function CookieConsent() {
  const { cookiePreferences, updateCookiePreferences, hasConsented } =
    useCookiePreferences();
  const [isOpen, setIsOpen] = useState(!hasConsented);
  const [isSaving, setIsSaving] = useState(false);

  const handleAcceptAll = async () => {
    setIsSaving(true);
    await updateCookiePreferences({
      analytics: true,
      preferences: true,
    });
    setIsSaving(false);
    setIsOpen(false);
  };

  const handleCustomize = async () => {
    setIsSaving(true);
    await updateCookiePreferences({
      analytics: cookiePreferences.analytics,
      preferences: cookiePreferences.preferences,
    });
    setIsSaving(false);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Cookie Preferences</CardTitle>
          <CardDescription>
            We use cookies to enhance your browsing experience and analyze our
            traffic. Please review our{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              privacy policy
            </Link>{" "}
            for more information.
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
              onCheckedChange={(checked) =>
                updateCookiePreferences({ analytics: checked as boolean })
              }
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
              onCheckedChange={(checked) =>
                updateCookiePreferences({ preferences: checked as boolean })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="preferences">Preference Cookies</Label>
              <p className="text-sm text-muted-foreground">
                Remember your settings and preferences
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleCustomize}
            disabled={isSaving}
          >
            Save Preferences
          </Button>
          <Button onClick={handleAcceptAll} disabled={isSaving}>
            Accept All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
