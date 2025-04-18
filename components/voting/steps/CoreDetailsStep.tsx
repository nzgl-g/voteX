import { useState } from "react";
import { Input } from "@/components/shadcn-ui/input";
import { Label } from "@/components/shadcn-ui/label";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { BannerGallery } from "@/components/voting/BannerGallery";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { CalendarIcon, FileTextIcon, BuildingIcon, ImageIcon, AlertCircleIcon } from "lucide-react";

interface CoreDetailsStepProps {
  formData: {
    title: string;
    description: string;
    organization: string;
    banner: {
      id: string;
      url: string;
      file?: File;
    };
  };
  updateFormData: (data: Partial<{
    title: string;
    description: string;
    organization: string;
    banner: {
      id: string;
      url: string;
      file?: File;
    };
  }>) => void;
}

export function CoreDetailsStep({ formData, updateFormData }: CoreDetailsStepProps) {
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    organization?: string;
  }>({});

  const [touched, setTouched] = useState<{
    title: boolean;
    description: boolean;
    organization: boolean;
  }>({
    title: false,
    description: false,
    organization: false
  });

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      return "Title is required";
    }
    if (value.length > 60) {
      return "Title must be 60 characters or less";
    }
    return "";
  };

  const validateDescription = (value: string) => {
    if (!value.trim()) {
      return "Description is required";
    }
    if (value.split(/\s+/).filter(Boolean).length > 200) {
      return "Description must be 200 words or less";
    }
    return "";
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const error = validateTitle(value);

    setErrors(prev => ({ ...prev, title: error }));
    updateFormData({ title: value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const error = validateDescription(value);

    setErrors(prev => ({ ...prev, description: error }));
    updateFormData({ description: value });
  };

  const handleOrganizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ organization: e.target.value });
  };

  const handleBannerSelect = (banner: { id: string; url: string; file?: File }) => {
    updateFormData({ banner });
  };

  const handleBlur = (field: 'title' | 'description' | 'organization') => {
    setTouched(prev => ({ ...prev, [field]: true }));

    if (field === 'title') {
      const error = validateTitle(formData.title);
      setErrors(prev => ({ ...prev, title: error }));
    } else if (field === 'description') {
      const error = validateDescription(formData.description);
      setErrors(prev => ({ ...prev, description: error }));
    }
  };

  const characterCount = formData.title.length;
  const wordCount = formData.description ? formData.description.split(/\s+/).filter(Boolean).length : 0;

  return (
      <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="border-b pb-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Session Details</h3>
          <p className="text-gray-500 mt-1">Set up the basic information for your voting session</p>
        </div>

        <div className="space-y-6">
          {/* Title Field */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <Label htmlFor="title" className="text-md font-medium">
                Session Title <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="A concise, descriptive name (max 60 chars)." />
            </div>

            <Input
                id="title"
                value={formData.title}
                onChange={handleTitleChange}
                onBlur={() => handleBlur('title')}
                className={`mt-1 ${(touched.title && errors.title) ? "border-red-500 ring-1 ring-red-500" : ""}`}
                aria-invalid={!!(touched.title && errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                maxLength={60}
                placeholder="Enter session title (required)"
            />

            <div className="flex justify-between items-center mt-1 text-xs">
              {(touched.title && errors.title) ? (
                  <div className="flex items-center text-red-500">
                    <AlertCircleIcon className="h-3 w-3 mr-1" />
                    <p id="title-error">{errors.title}</p>
                  </div>
              ) : (
                  <p className="text-gray-500 text-xs">Required field</p>
              )}
              <span className={characterCount > 50 ? (characterCount >= 60 ? "text-red-500 font-medium" : "text-amber-500") : "text-gray-500"}>
              {characterCount}/60 characters
            </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileTextIcon className="h-5 w-5 text-primary" />
              <Label htmlFor="description" className="text-md font-medium">
                Session Description <span className="text-red-500">*</span>
              </Label>
              <InfoTooltip text="Explain purpose/audience/rules in ≤200 words." />
            </div>

            <Textarea
                id="description"
                value={formData.description}
                onChange={handleDescriptionChange}
                onBlur={() => handleBlur('description')}
                className={`min-h-32 mt-1 ${(touched.description && errors.description) ? "border-red-500 ring-1 ring-red-500" : ""}`}
                aria-invalid={!!(touched.description && errors.description)}
                aria-describedby={errors.description ? "description-error" : undefined}
                placeholder="Describe your voting session (required)"
            />

            <div className="flex justify-between items-center mt-1 text-xs">
              {(touched.description && errors.description) ? (
                  <div className="flex items-center text-red-500">
                    <AlertCircleIcon className="h-3 w-3 mr-1" />
                    <p id="description-error">{errors.description}</p>
                  </div>
              ) : (
                  <p className="text-gray-500 text-xs">Required field</p>
              )}
              <span className={wordCount > 180 ? (wordCount > 200 ? "text-red-500 font-medium" : "text-amber-500") : "text-gray-500"}>
              {wordCount}/200 words
            </span>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-3 text-sm text-blue-700">
              <p>A good description helps voters understand what they're voting for and why their participation matters.</p>
            </div>
          </div>

          {/* Organization Field */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BuildingIcon className="h-5 w-5 text-primary" />
              <Label htmlFor="organization" className="text-md font-medium">Organization</Label>
              <InfoTooltip text="Hosting department or group." />
            </div>

            <Input
                id="organization"
                value={formData.organization}
                onChange={handleOrganizationChange}
                onBlur={() => handleBlur('organization')}
                className="mt-1"
                placeholder="Enter your organization name (optional)"
            />

            <p className="text-gray-500 text-xs mt-1">Optional field</p>
          </div>

          {/* Banner Selection */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-primary" />
              <Label className="text-md font-medium">Banner Selection</Label>
              <InfoTooltip text="Choose a banner for branding." />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <BannerGallery
                  onSelect={handleBannerSelect}
                  selected={formData.banner.id}
              />
            </div>

            <p className="text-gray-500 text-xs mt-2">A banner helps create a unique identity for your voting session</p>
          </div>
        </div>

        {/* Summary Card */}
        {(formData.title || formData.description) && (
            <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-2 text-gray-700">Preview</h4>
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-500">Title:</p>
                <p className="text-md">{formData.title || "No title provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description:</p>
                <p className="text-sm">{formData.description || "No description provided"}</p>
              </div>
            </div>
        )}
      </div>
  );
}