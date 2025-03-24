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

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(true);
  const { cookiePreferences, updateCookiePreferences } = useCookiePreferences();
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
            traffic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="essential" checked disabled />
            <Label htmlFor="essential">Essential Cookies</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={cookiePreferences.analytics}
              onCheckedChange={(checked) =>
                updateCookiePreferences({ analytics: checked as boolean })
              }
            />
            <Label htmlFor="analytics">Analytics Cookies</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preferences"
              checked={cookiePreferences.preferences}
              onCheckedChange={(checked) =>
                updateCookiePreferences({ preferences: checked as boolean })
              }
            />
            <Label htmlFor="preferences">Preference Cookies</Label>
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
