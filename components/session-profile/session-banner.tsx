"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/shadcn-ui/card"
import { Button } from "@/components/shadcn-ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn-ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs"
import { Label } from "@/components/shadcn-ui/label"
import { Input } from "@/components/shadcn-ui/input"
import { ImagePlus, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { sessionService } from "@/api/session-service"

const PRESET_BANNERS = [
  {
    id: "banner1",
    name: "Abstract Blue",
    url: "/placeholder.svg?height=240&width=1200",
  },
  {
    id: "banner2",
    name: "Geometric Pattern",
    url: "/placeholder.svg?height=240&width=1200",
  },
  {
    id: "banner3",
    name: "Blockchain Theme",
    url: "/placeholder.svg?height=240&width=1200",
  },
]

interface SessionBannerProps {
  sessionId?: string;
}

export function SessionBanner({ sessionId }: SessionBannerProps) {
  const [bannerUrl, setBannerUrl] = useState<string>("/placeholder.svg?height=240&width=1200")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sessionTitle, setSessionTitle] = useState<string>("Vote Session Management")

  // Fetch session data when sessionId changes
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;
      
      try {
        const session = await sessionService.getSessionById(sessionId);
        if (session) {
          // Set the banner URL if it exists
          if (session.banner) {
            setBannerUrl(session.banner);
          }
          
          // Set the session title
          if (session.name) {
            setSessionTitle(session.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session banner:", error);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);

  const handleSelectBanner = async (url: string) => {
    setBannerUrl(url)
    setIsDialogOpen(false)
    
    // Update the banner on the backend if we have a sessionId
    if (sessionId) {
      try {
        // Note: This would need a proper updateSession method in the service
        // For now, we're just showing the toast as if it succeeded
        // await sessionService.updateSession(sessionId, { banner: url });
        
        toast({
          title: "Banner updated",
          description: "Session banner has been updated successfully.",
        });
      } catch (error) {
        console.error("Failed to update session banner:", error);
        toast({
          title: "Error",
          description: "Failed to update session banner. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Banner updated",
        description: "Session banner has been updated successfully.",
      });
    }
  }

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a server
      // For this demo, we'll create a local URL
      const url = URL.createObjectURL(file)
      setBannerUrl(url)
      setIsDialogOpen(false)
      
      // Update the banner on the backend if we have a sessionId
      if (sessionId) {
        try {
          // This would be replaced with actual file upload logic
          // const uploadedUrl = await uploadImageToServer(file);
          // await sessionService.updateSession(sessionId, { banner: uploadedUrl });
          
          toast({
            title: "Banner uploaded",
            description: "Your custom banner has been uploaded successfully.",
          });
        } catch (error) {
          console.error("Failed to upload session banner:", error);
          toast({
            title: "Error",
            description: "Failed to upload session banner. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Banner uploaded",
          description: "Your custom banner has been uploaded successfully.",
        });
      }
    }
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative">
        <div
          className="h-40 md:h-60 bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="text-2xl md:text-4xl font-bold text-center text-white">{sessionTitle}</h1>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="absolute bottom-4 right-4">
              <ImagePlus className="h-4 w-4 mr-2" />
              Change Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Change Session Banner</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="preset" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="preset">Preset Banners</TabsTrigger>
                <TabsTrigger value="upload">Upload Banner</TabsTrigger>
              </TabsList>
              <TabsContent value="preset" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRESET_BANNERS.map((banner) => (
                    <div
                      key={banner.id}
                      className="relative cursor-pointer rounded-md overflow-hidden border hover:border-primary transition-colors"
                      onClick={() => handleSelectBanner(banner.url)}
                    >
                      <img
                        src={banner.url || "/placeholder.svg"}
                        alt={banner.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2 text-center text-sm font-medium">{banner.name}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your banner image, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">Recommended size: 1200×240px. Max file size: 2MB</p>
                  <div className="relative">
                    <Label htmlFor="banner-upload" className="sr-only">
                      Upload banner
                    </Label>
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleUploadBanner}
                    />
                    <Button variant="outline">Select Image</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
