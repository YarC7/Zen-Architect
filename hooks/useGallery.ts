import { useEffect, useState } from "react";

export interface GalleryImage {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  url: string;
}

export function useGallery(prefix: string = "backgrounds/") {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gallery?prefix=${encodeURIComponent(prefix)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch gallery");
      }
      const data = await response.json();
      setImages(data.images);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [prefix]);

  const deleteImage = async (key: string) => {
    try {
      const response = await fetch(
        `/api/upload?key=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Refresh gallery
      fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  return { images, loading, error, fetchImages, deleteImage };
}
