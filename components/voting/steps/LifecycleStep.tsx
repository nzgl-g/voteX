import { useState, useEffect } from "react";
import { Calendar } from "@/components/shadcn-ui/calendar";
import { Label } from "@/components/shadcn-ui/label";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { format, addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  AlertCircleIcon
} from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/shadcn-ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/shadcn-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn-ui/select";

interface LifecycleStepProps {
  formData: {
    startDate: Date;
    endDate: Date;
    preparationSchedule: Date | null;
  };
  updateFormData: (data: Partial<{
    startDate: Date;
    endDate: Date;
    preparationSchedule: Date | null;
  }>) => void;
}

export function LifecycleStep({ formData, updateFormData }: LifecycleStepProps) {
  const [errors, setErrors] = useState<{
    startDate?: string;
    endDate?: string;
    preparationSchedule?: string;
  }>({});

  const [sessionDuration, setSessionDuration] = useState<string>("");

  useEffect(() => {
    // Calculate session duration whenever dates change
    const days = differenceInDays(formData.endDate, formData.startDate);
    const hours = formData.endDate.getHours() - formData.startDate.getHours();
    const minutes = formData.endDate.getMinutes() - formData.startDate.getMinutes();

    let durationText = "";
    if (days > 0) {
      durationText += `${days} day${days > 1 ? 's' : ''} `;
    }

    const totalHours = hours + (minutes / 60);
    if (totalHours > 0 || (days === 0 && totalHours === 0)) {
      const hoursFormatted = Math.floor(totalHours);
      const minutesFormatted = Math.round((totalHours - hoursFormatted) * 60);

      if (hoursFormatted > 0) {
        durationText += `${hoursFormatted} hour${hoursFormatted > 1 ? 's' : ''} `;
      }

      if (minutesFormatted > 0) {
        durationText += `${minutesFormatted} minute${minutesFormatted > 1 ? 's' : ''}`;
      }
    }

    setSessionDuration(durationText.trim());
  }, [formData.startDate, formData.endDate]);

  const validateDates = () => {
    const now = new Date();
    const newErrors: typeof errors = {};

    if (isBefore(formData.startDate, now)) {
      newErrors.startDate = "Start date must be in the future";
    }

    if (!isAfter(formData.endDate, formData.startDate)) {
      newErrors.endDate = "End date must be after the start date";
    }

    if (formData.preparationSchedule && !isBefore(formData.preparationSchedule, formData.startDate)) {
      newErrors.preparationSchedule = "Preparation must end before session starts";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // Preserve the time from the existing startDate
      const newDate = new Date(date);
      newDate.setHours(formData.startDate.getHours());
      newDate.setMinutes(formData.startDate.getMinutes());

      updateFormData({ startDate: newDate });
      validateDates();
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      // Preserve the time from the existing endDate
      const newDate = new Date(date);
      newDate.setHours(formData.endDate.getHours());
      newDate.setMinutes(formData.endDate.getMinutes());

      updateFormData({ endDate: newDate });
      validateDates();
    }
  };

  const handlePrepDateChange = (date: Date | undefined) => {
    updateFormData({ preparationSchedule: date || null });
    validateDates();
  };

  const handleTimeChange = (field: 'startHour' | 'startMinute' | 'endHour' | 'endMinute', value: string) => {
    const numValue = parseInt(value, 10);

    if (field === 'startHour' || field === 'startMinute') {
      const newDate = new Date(formData.startDate);
      if (field === 'startHour') {
        newDate.setHours(numValue);
      } else {
        newDate.setMinutes(numValue);
      }
      updateFormData({ startDate: newDate });
    } else {
      const newDate = new Date(formData.endDate);
      if (field === 'endHour') {
        newDate.setHours(numValue);
      } else {
        newDate.setMinutes(numValue);
      }
      updateFormData({ endDate: newDate });
    }

    validateDates();
  };

  // Generate hours and minutes for dropdowns
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="border-b pb-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-gray-800">Session Timeline</h3>
          </div>
          <p className="text-gray-500 mt-1">Set when your voting session starts and ends</p>
        </div>

        {/* Start Date & Time */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Label className="text-md font-medium">Start Date & Time <span className="text-red-500">*</span></Label>
            <InfoTooltip text="When voters can begin submitting their votes." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left",
                        errors.startDate ? "border-red-500 ring-1 ring-red-500" : ""
                    )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(formData.startDate, "EEE, MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Hour and Minute Selector */}
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <Select
                  value={formData.startDate.getHours().toString()}
                  onValueChange={(value) => handleTimeChange('startHour', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                      <SelectItem key={`start-hour-${hour}`} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-lg">:</span>
              <Select
                  value={formData.startDate.getMinutes().toString()}
                  onValueChange={(value) => handleTimeChange('startMinute', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={`start-minute-${minute}`} value={minute.toString()}>
                        {minute.toString().padStart(2, '0')}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errors.startDate && (
              <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <p>{errors.startDate}</p>
              </div>
          )}
        </div>

        {/* End Date & Time */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Label className="text-md font-medium">End Date & Time <span className="text-red-500">*</span></Label>
            <InfoTooltip text="When the voting session closes." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left",
                        errors.endDate ? "border-red-500 ring-1 ring-red-500" : ""
                    )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(formData.endDate, "EEE, MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Hour and Minute Selector */}
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <Select
                  value={formData.endDate.getHours().toString()}
                  onValueChange={(value) => handleTimeChange('endHour', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                      <SelectItem key={`end-hour-${hour}`} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-lg">:</span>
              <Select
                  value={formData.endDate.getMinutes().toString()}
                  onValueChange={(value) => handleTimeChange('endMinute', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={`end-minute-${minute}`} value={minute.toString()}>
                        {minute.toString().padStart(2, '0')}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errors.endDate && (
              <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <p>{errors.endDate}</p>
              </div>
          )}
        </div>

        {/* Session Duration Card */}
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center text-blue-700">
            <div className="flex flex-col items-center">
              <div className="text-sm">Starts</div>
              <div className="font-medium">{format(formData.startDate, "MMM d, h:mm a")}</div>
            </div>
            <ArrowRightIcon className="mx-4 h-5 w-5" />
            <div className="flex flex-col items-center">
              <div className="text-sm">Ends</div>
              <div className="font-medium">{format(formData.endDate, "MMM d, h:mm a")}</div>
            </div>
          </div>
        </div>

        {sessionDuration && (
            <div className="flex justify-center text-gray-500 text-sm">
              Session duration: <span className="font-medium ml-1">{sessionDuration}</span>
            </div>
        )}

        {/* Preparation Schedule */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Label className="text-md font-medium">Preparation Schedule</Label>
            <InfoTooltip text="Optional preparation period ending before voting starts." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left",
                        errors.preparationSchedule ? "border-red-500 ring-1 ring-red-500" : ""
                    )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {formData.preparationSchedule ? format(formData.preparationSchedule, "EEE, MMM d, yyyy") : "No preparation scheduled"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2">
                  <Button
                      variant="ghost"
                      className="w-full justify-start mb-2"
                      onClick={() => handlePrepDateChange(undefined)}
                  >
                    No preparation
                  </Button>
                  <Calendar
                      mode="single"
                      selected={formData.preparationSchedule || undefined}
                      onSelect={handlePrepDateChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {formData.preparationSchedule && (
                <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-md text-amber-800 text-sm">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                  <span>Must be completed before voting session starts</span>
                </div>
            )}
          </div>

          {errors.preparationSchedule && (
              <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <p>{errors.preparationSchedule}</p>
              </div>
          )}

          <p className="text-gray-500 text-xs mt-2">
            Set a preparation date if you need time to collect nominations or prepare candidates before voting begins
          </p>
        </div>

        {/* Quick Options */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setDate(start.getDate() + 1);
                start.setHours(9, 0, 0, 0);

                const end = new Date(start);
                end.setDate(end.getDate() + 7);
                end.setHours(17, 0, 0, 0);

                updateFormData({ startDate: start, endDate: end });
                validateDates();
              }}
          >
            1 Week Election
          </Button>

          <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setDate(start.getDate() + 1);
                start.setHours(9, 0, 0, 0);

                const end = new Date(start);
                end.setHours(17, 0, 0, 0);

                updateFormData({ startDate: start, endDate: end });
                validateDates();
              }}
          >
            1 Day Election
          </Button>

          <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const today = new Date(now);
                today.setHours(now.getHours() + 1, 0, 0, 0);

                const end = new Date(today);
                end.setHours(today.getHours() + 2);

                updateFormData({ startDate: today, endDate: end });
                validateDates();
              }}
          >
            2 Hour Meeting
          </Button>
        </div>
      </div>
  );
}