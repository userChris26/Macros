import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { MealPhoto } from '@/components/ui/meal-photo';
import { cn } from '@/lib/utils';

interface MealPhotoUploadProps {
  userId: string;
  date: string;
  mealType: string;
  onPhotoUpdate: () => void;
  photoUrl?: string;
}

export function MealPhotoUpload({ userId, date, mealType, onPhotoUpdate, photoUrl }: MealPhotoUploadProps) {
  const [loading, setLoading] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress as JPEG with 0.8 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit for original file)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setLoading(true);

    try {
      // Compress image before upload
      const compressedBase64 = await compressImage(file);
      
      // Check compressed size
      const base64Size = compressedBase64.length * 0.75; // Approximate size in bytes
      if (base64Size > 5 * 1024 * 1024) {
        throw new Error('Compressed image is still too large. Please try a smaller image.');
      }

      // Upload to server
      const response = await fetch(`${getApiUrl()}/api/meal/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date,
          mealType,
          photoBase64: compressedBase64
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Photo uploaded successfully');
        onPhotoUpdate();
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/meal/photo`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date,
          mealType
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Photo deleted successfully');
        onPhotoUpdate();
      } else {
        toast.error(data.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        disabled={loading}
      />
      <MealPhoto
        photoUrl={photoUrl}
        mealType={mealType}
        className={cn(
          "transition-opacity",
          loading && "opacity-50"
        )}
      />
      {photoUrl && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 