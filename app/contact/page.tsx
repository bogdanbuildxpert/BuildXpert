"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ContactPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    preferredContact: "EMAIL",
  });

  // Update form data when user is logged in
  useEffect(() => {
    if (user) {
      // Split the name if available, otherwise use empty strings
      const nameParts = user.name ? user.name.split(" ") : ["", ""];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      setFormData((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredContact: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Your message has been sent successfully! A confirmation email has been sent to your inbox.",
          { duration: 6000 }
        );
        // Reset form if not logged in, otherwise keep user data
        if (!user) {
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
            preferredContact: "EMAIL",
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            subject: "",
            message: "",
            preferredContact: "EMAIL",
          }));
        }
      } else {
        toast.error(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions about our services or want to discuss your project?
            Get in touch with us using the form below or through our contact
            information.
          </p>
          {user && (
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-sm">
                Welcome back,{" "}
                <span className="font-medium">{user.name || user.email}</span>!
                Your contact information has been pre-filled for your
                convenience.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+353 1 234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Contact Method</Label>
                <RadioGroup
                  value={formData.preferredContact}
                  onValueChange={handleRadioChange}
                  className="flex space-x-8 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMAIL" id="email-contact" />
                    <Label htmlFor="email-contact" className="cursor-pointer">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PHONE" id="phone-contact" />
                    <Label htmlFor="phone-contact" className="cursor-pointer">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Phone
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {formData.preferredContact === "PHONE" && !formData.phone && (
                  <p className="text-xs text-amber-500 mt-1">
                    Please provide a phone number if you prefer to be contacted
                    by phone.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide details about your inquiry or project..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  isLoading ||
                  (formData.preferredContact === "PHONE" && !formData.phone)
                }
              >
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <address className="not-italic text-muted-foreground">
                      <p>UNIT 4 FIRST FLOOR, 84 STRAND STREET</p>
                      <p>SKERRIES</p>
                      <p>DUBLIN</p>
                      <p>K34VW93</p>
                    </address>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-muted-foreground">
                      <a
                        href="tel:+353838329361"
                        className="hover:text-foreground transition-colors"
                      >
                        +353 83 832 9361
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-muted-foreground">
                      <a
                        href="mailto:bogdan@buildxpert.ie"
                        className="hover:text-foreground transition-colors"
                      >
                        bogdan@buildxpert.ie
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Business Hours</h2>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="aspect-[4/3] w-full h-auto rounded-lg overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2378.8455487046376!2d-6.1100456231499745!3d53.58269397271422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x486703c05fb9d2d5%3A0xd463b93084b20a07!2s84%20Strand%20St%2C%20Skerries%2C%20Co.%20Dublin%2C%20K34%20VW93!5e0!3m2!1sen!2sie!4v1719256789644!5m2!1sen!2sie"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title="BuildXpert Office Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
