import { useState } from "react";
import { Card, CardContent } from "@/components/shadcn-ui/card";
import { FileUpload } from "./FileUpload";
import { ScrollArea } from "@/components/shadcn-ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

// Sample banner options
const DEFAULT_BANNERS = [
  {
    id: "sessionPhoto1",
    url: "https://images.unsplash.com/photo-1620050046774-001d21c25475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto2",
    url: "https://images.unsplash.com/photo-1575320181282-74c1e9c1b8ba?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto3",
    url: "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto4",
    url: "https://images.unsplash.com/photo-1581093588401-a7f579bd4e1f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto5",
    url: "https://images.unsplash.com/photo-1603572155377-088dc4f92d3c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto6",
    url: "https://images.unsplash.com/photo-1614692308634-7688f2a95a61?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto7",
    url: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sessionPhoto8",
    url: "https://images.unsplash.com/photo-1603572185175-4ce565a0c745?auto=format&fit=crop&w=1200&q=80",
  },
];


interface BannerGalleryProps {
  onSelect: (banner: { id: string; url: string; file?: File }) => void;
  selected?: string;
  className?: string;
}

export function BannerGallery({ onSelect, selected, className }: BannerGalleryProps) {
  const [customBanner, setCustomBanner] = useState<{ id: string; url: string; file: File } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      const newBanner = {
        id: "custom",
        url: objectUrl,
        file
      };
      setCustomBanner(newBanner);
      onSelect(newBanner);
    } else {
      setCustomBanner(null);
    }
  };

  const allBanners = [
    ...(customBanner ? [customBanner] : []),
    ...DEFAULT_BANNERS
  ];

  return (
      <div className={cn("space-y-4", className)}>
        <FileUpload
            accept="image/*"
            maxSize={2 * 1024 * 1024}
            onFileChange={handleFileChange}
            label="Upload custom banner"
            description="Recommended size: 1200×300px (max 2MB)"
        />

        <div className="flex items-center justify-between text-muted-foreground mb-2 text-sm">
          <span>Select from gallery</span>
          <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-primary hover:underline"
          >
            {isExpanded ? (
                <>
                  Collapse <ChevronUp className="w-4 h-4" />
                </>
            ) : (
                <>
                  Expand <ChevronDown className="w-4 h-4" />
                </>
            )}
          </button>
        </div>

        <ScrollArea className={cn("w-full rounded-md border p-2", isExpanded ? "h-auto max-h-[80vh]" : "h-52")}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
            {allBanners.map((banner) => (
                <Card
                    key={banner.id}
                    className={cn(
                        "overflow-hidden cursor-pointer transition-all m-2",
                        selected === banner.id ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-muted-foreground"
                    )}
                    onClick={() => onSelect(banner)}

                >
                  <CardContent className="p-2"> {/* Inner padding added here */}
                    <div className="w-full h-32 rounded overflow-hidden">
                      <img
                          src={banner.url}
                          alt="Banner option"
                          className="w-full h-full object-cover rounded"
                      />
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
  );
}
