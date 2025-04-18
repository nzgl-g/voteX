import { useState, useEffect } from "react";
import { Label } from "@/components/shadcn-ui/label";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { FeatureCard } from "@/components/voting/FeatureCard";
import { Input } from "@/components/shadcn-ui/input";
import { FileUpload } from "@/components/voting/FileUpload";
import {
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  FileTextIcon,
  GlobeIcon,
  UsersIcon,
  LockIcon,
  DownloadIcon
} from "lucide-react";
import { AccessControlType } from "@/lib/voting";

interface AccessControlStepProps {
  formData: {
    accessControl: AccessControlType;
    secretPhrase: string;
    csvInviteFile: File | null;
  };
  updateFormData: (data: Partial<{
    accessControl: AccessControlType;
    secretPhrase: string;
    csvInviteFile: File | null;
  }>) => void;
}

export function AccessControlStep({ formData, updateFormData }: AccessControlStepProps) {
  const [errors, setErrors] = useState<{
    secretPhrase?: string;
    csvInviteFile?: string;
  }>({});

  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleAccessTypeSelect = (type: AccessControlType) => {
    updateFormData({ accessControl: type });

    // Clear errors when changing access type
    setErrors({});
  };

  const handleSecretPhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!value && formData.accessControl === "secret-phrase") {
      setErrors(prev => ({ ...prev, secretPhrase: "Secret phrase is required" }));
    } else {
      setErrors(prev => ({ ...prev, secretPhrase: undefined }));
    }

    updateFormData({ secretPhrase: value });
  };

  const handleCsvFileChange = (file: File | null) => {
    if (!file && formData.accessControl === "csv-invite") {
      setErrors(prev => ({ ...prev, csvInviteFile: "CSV file is required" }));
    } else {
      setErrors(prev => ({ ...prev, csvInviteFile: undefined }));
    }

    updateFormData({ csvInviteFile: file });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, this would be a link to download the template
    console.log("Download template");
  };

  return (
      <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="border-b pb-6">
          <div className="flex items-center gap-2 mb-4">
            <LockIcon className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">Access Control</h3>
          </div>
          <p className="text-gray-500 mb-6">Choose who can access and vote in your election</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
                title="Public"
                description="Anyone with the link can vote"
                icon={<GlobeIcon className="h-8 w-8 text-primary" />}
                selected={formData.accessControl === "public"}
                onClick={() => handleAccessTypeSelect("public")}
            />

            <FeatureCard
                title="Private"
                description="Restricted to authorized users"
                icon={<UsersIcon className="h-8 w-8 text-primary" />}
                selected={formData.accessControl === "private" || formData.accessControl === "secret-phrase" || formData.accessControl === "csv-invite"}
                onClick={() => handleAccessTypeSelect("private")}
            />
          </div>
        </div>

        {(formData.accessControl === "private" || formData.accessControl === "secret-phrase" || formData.accessControl === "csv-invite") && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-lg font-medium">Access Method</h4>
                <InfoTooltip text="Select how voters will authenticate themselves" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FeatureCard
                    title="Secret Phrase"
                    description="Protected by a shared password"
                    icon={<KeyIcon className="h-8 w-8 text-primary" />}
                    selected={formData.accessControl === "secret-phrase"}
                    onClick={() => handleAccessTypeSelect("secret-phrase")}
                />

                <FeatureCard
                    title="CSV Invite"
                    description="Import specific voters by CSV"
                    icon={<FileTextIcon className="h-8 w-8 text-primary" />}
                    selected={formData.accessControl === "csv-invite"}
                    onClick={() => handleAccessTypeSelect("csv-invite")}
                />
              </div>
            </div>
        )}

        {formData.accessControl === "secret-phrase" && (
            <div className="space-y-4 pt-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Label htmlFor="secretPhrase" className="text-md font-medium">Secret Phrase</Label>
                <InfoTooltip text="Share this phrase with intended voters only." />
              </div>
              <p className="text-sm text-gray-500">Voters will need to enter this exact phrase to access the election.</p>

              <div className="relative">
                <Input
                    id="secretPhrase"
                    type={passwordVisible ? "text" : "password"}
                    value={formData.secretPhrase}
                    onChange={handleSecretPhraseChange}
                    placeholder="Enter a secret phrase"
                    className={`${errors.secretPhrase ? "border-red-500" : ""} pr-10 text-md`}
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={togglePasswordVisibility}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.secretPhrase && (
                  <p className="text-red-500 text-sm">{errors.secretPhrase}</p>
              )}

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-2">
                <p className="text-sm font-medium text-amber-800">Security Note</p>
                <p className="text-xs text-amber-700">
                  Use a unique phrase that's not easily guessable. Share this phrase only with intended voters through secure channels.
                </p>
              </div>
            </div>
        )}

        {formData.accessControl === "csv-invite" && (
            <div className="space-y-4 pt-4 bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-md font-medium">CSV Upload</Label>
                  <InfoTooltip text="Use our template to avoid import errors." />
                </div>
                <button
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark"
                    onClick={downloadTemplate}
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>Download template</span>
                </button>
              </div>

              <FileUpload
                  accept=".csv"
                  maxSize={5 * 1024 * 1024}
                  onFileChange={handleCsvFileChange}
                  label="Upload CSV file"
                  description="Upload file with voter credentials"
                  error={errors.csvInviteFile}
              />

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">CSV Template Format</p>
                <div className="text-xs text-blue-700 mt-2 overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Date of Birth</th>
                      <th className="px-2 py-1 text-left">Place of Birth</th>
                      <th className="px-2 py-1 text-left">Email</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                    <tr>
                      <td className="px-2 py-1">John Doe</td>
                      <td className="px-2 py-1">1990-01-01</td>
                      <td className="px-2 py-1">New York</td>
                      <td className="px-2 py-1">john@example.com</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1">Jane Smith</td>
                      <td className="px-2 py-1">1985-05-15</td>
                      <td className="px-2 py-1">Chicago</td>
                      <td className="px-2 py-1">jane@example.com</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}