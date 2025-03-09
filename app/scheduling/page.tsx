"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SchedulingPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [isBooking, setIsBooking] = useState(false)

  const handleBooking = () => {
    if (!date || !timeSlot) return

    setIsBooking(true)
    // Simulate API call
    setTimeout(() => {
      setIsBooking(false)
      // Show success message or redirect
    }, 1500)
  }

  // Sample available time slots
  const availableTimeSlots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
  ]

  return (
    <div className="container py-16 md:py-24">
      <div className="space-y-12 fade-in">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold">Schedule a Consultation</h1>
          <p className="text-muted-foreground">
            Book a consultation with our team to discuss your project requirements and get expert advice.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
              <CardDescription>Choose your preferred date for the consultation</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(date) => {
                  // Disable weekends and past dates
                  const day = date.getDay()
                  const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
                  return day === 0 || day === 6 || isPastDate
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Complete your booking information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="time-slot">Select Time Slot</Label>
                <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!date}>
                  <SelectTrigger id="time-slot">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!date && <p className="text-xs text-muted-foreground">Please select a date first</p>}
              </div>

              <div className="space-y-4">
                <div className="rounded-md bg-secondary p-4">
                  <div className="font-medium">Selected Booking:</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {date ? (
                      <p>
                        Date:{" "}
                        {date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    ) : (
                      <p>Date: Not selected</p>
                    )}
                    <p>Time: {timeSlot || "Not selected"}</p>
                    <p>Service: Initial Consultation</p>
                  </div>
                </div>

                <Button onClick={handleBooking} className="w-full" disabled={!date || !timeSlot || isBooking}>
                  {isBooking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-secondary p-8 md:p-12 rounded-lg">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center">Scheduling Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Consultation Details</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Initial consultations typically last 45-60 minutes</li>
                  <li>Our expert will discuss your project requirements</li>
                  <li>You'll receive a preliminary estimate</li>
                  <li>We can schedule a site visit if needed</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-medium">What to Prepare</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Project details and requirements</li>
                  <li>Timeline expectations</li>
                  <li>Budget considerations</li>
                  <li>Any reference images or inspiration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

