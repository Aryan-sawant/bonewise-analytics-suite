
import { useState, useRef } from 'react';
import { Upload, ImageIcon, FileType, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  className?: string;
  buttonText?: string;
  description?: string;
  isLoading?: boolean;
  imageUrl?: string | null;
}

const ImageUpload = ({
  onImageSelected,
  acceptedFileTypes = "image/jpeg, image/png, image/jpg",
  maxSizeMB = 5,
  className,
  buttonText = "Select Image",
  description = "Upload an image for analysis",
  isLoading = false,
  imageUrl = null,
}: ImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(imageUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const resetUpload = () => {
    setPreviewImage(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload ${acceptedFileTypes.split(', ').join(' or ')}`);
      return false;
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };
  
  const handleFile = (file: File) => {
    if (!validateFile(file)) return;
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setFileName(file.name);
    onImageSelected(file);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  
  return (
    <div className={cn("w-full", className)}>
      {previewImage ? (
        <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 p-2">
          <div className="relative aspect-video md:aspect-auto md:h-[300px] w-full overflow-hidden rounded-md">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="mt-4 flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <FileType size={20} className="text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[150px] md:max-w-xs">
                {fileName}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetUpload}
              disabled={isLoading}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-10 transition-colors",
            dragActive && "border-primary/50 bg-primary/5",
            "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-background p-3 shadow-sm border">
              {dragActive ? (
                <Upload size={24} className="text-primary animate-pulse" />
              ) : (
                <ImageIcon size={24} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {dragActive ? "Drop your file here" : description}
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptedFileTypes.replace(/image\//g, '').replace(/,/g, ', ')} up to {maxSizeMB}MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {buttonText}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
