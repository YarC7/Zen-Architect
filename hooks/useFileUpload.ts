import { useState } from "react";
import { toast } from "sonner";

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = async (file: File, folder: string = "uploads") => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setUploadProgress(100);
      toast.success("File uploaded successfully!");
      return data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { upload, isUploading, uploadProgress };
}
