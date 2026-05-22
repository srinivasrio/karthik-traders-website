"use client";

import { useState, useRef, useCallback } from 'react';
import { uploadProductImageAction } from '@/app/actions/uploadImage';
import {
    PhotoIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
    ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

interface ImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    maxSizeMB?: number;
    category?: string;
}

interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    error?: string;
}

export default function ImageUploader({
    images,
    onChange,
    maxImages = 8,
    maxSizeMB = 5,
    category = '',
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState<UploadingFile[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const validateFile = (file: File): string | null => {
        if (!acceptedTypes.includes(file.type)) {
            return 'Only JPG, PNG, and WebP images are allowed';
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size must be under ${maxSizeMB}MB`;
        }
        return null;
    };

    const uploadFile = async (file: File): Promise<{ url: string | null; error?: string }> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);

            const result = await uploadProductImageAction(formData);

            if (!result.success || !result.publicUrl) {
                return { url: null, error: result.error || 'Upload failed' };
            }

            return { url: result.publicUrl };
        } catch (err: any) {
            console.error('Upload error in frontend:', err);
            return { url: null, error: err.message || 'An unexpected upload error occurred' };
        }
    };

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const remaining = maxImages - images.length;

        if (remaining <= 0) {
            alert(`Maximum ${maxImages} images allowed`);
            return;
        }

        const toUpload = fileArray.slice(0, remaining);
        const newUploading: UploadingFile[] = [];

        for (const file of toUpload) {
            const validationError = validateFile(file);
            if (validationError) {
                newUploading.push({
                    id: Math.random().toString(36),
                    file,
                    preview: URL.createObjectURL(file),
                    progress: 0,
                    error: validationError,
                });
                continue;
            }
            newUploading.push({
                id: Math.random().toString(36),
                file,
                preview: URL.createObjectURL(file),
                progress: 0,
            });
        }

        setUploading(prev => [...prev, ...newUploading]);
        setUploading(prev => prev.map(u => u.error ? u : { ...u, progress: 30 }));

        const uploadedUrls: string[] = [];

        for (const item of newUploading) {
            if (item.error) continue;

            setUploading(prev =>
                prev.map(u => u.id === item.id ? { ...u, progress: 60 } : u)
            );

            const { url, error } = await uploadFile(item.file);

            if (url) {
                uploadedUrls.push(url);
                setUploading(prev =>
                    prev.map(u => u.id === item.id ? { ...u, progress: 100 } : u)
                );
            } else {
                setUploading(prev =>
                    prev.map(u => u.id === item.id ? { ...u, error: error || 'Upload failed' } : u)
                );
            }
        }

        // Short delay so user sees 100% before removing
        setTimeout(() => {
            setUploading(prev => prev.filter(u => u.error));
            if (uploadedUrls.length > 0) {
                onChange([...images, ...uploadedUrls]);
            }
        }, 500);
    }, [images, maxImages, onChange, category]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
    };

    const removeUploadError = (id: string) => {
        setUploading(prev => prev.filter(u => u.id !== id));
    };

    const handleAddUrl = () => {
        const url = prompt('Enter image URL:');
        if (url && url.trim()) {
            if (images.length >= maxImages) {
                alert(`Maximum ${maxImages} images allowed`);
                return;
            }
            onChange([...images, url.trim()]);
        }
    };

    // Drag reorder handlers
    const handleReorderDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleReorderDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        const newImages = [...images];
        const [dragged] = newImages.splice(dragIndex, 1);
        newImages.splice(index, 0, dragged);
        onChange(newImages);
        setDragIndex(index);
    };

    const handleReorderDragEnd = () => {
        setDragIndex(null);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                    Product Images
                    <span className="text-slate-400 font-normal ml-1">
                        ({images.length}/{maxImages})
                    </span>
                </label>
                <button
                    type="button"
                    onClick={handleAddUrl}
                    className="text-xs text-aqua-600 hover:text-aqua-700 font-medium"
                >
                    + Add URL
                </button>
            </div>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${dragOver
                        ? 'border-aqua-400 bg-aqua-50 scale-[1.01]'
                        : 'border-slate-300 hover:border-aqua-300 hover:bg-slate-50'
                    }
                    ${images.length >= maxImages ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                    <div className={`
                        p-3 rounded-full transition-colors duration-200
                        ${dragOver ? 'bg-aqua-100' : 'bg-slate-100'}
                    `}>
                        {dragOver ? (
                            <ArrowUpTrayIcon className="h-6 w-6 text-aqua-500" />
                        ) : (
                            <PhotoIcon className="h-6 w-6 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            {dragOver ? 'Drop images here' : 'Drag & drop images here'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            or click to browse • JPG, PNG, WebP • Max {maxSizeMB}MB each
                        </p>
                    </div>
                </div>
            </div>

            {/* Uploading Progress */}
            {uploading.length > 0 && (
                <div className="space-y-2">
                    {uploading.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <img
                                src={item.preview}
                                alt="Uploading"
                                className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-600 truncate">
                                    {item.file.name}
                                </p>
                                {item.error ? (
                                    <p className="text-xs text-red-500">{item.error}</p>
                                ) : (
                                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-aqua-500 rounded-full transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            {item.error && (
                                <button
                                    type="button"
                                    onClick={() => removeUploadError(item.id)}
                                    className="p-1 hover:bg-slate-200 rounded"
                                >
                                    <XMarkIcon className="h-4 w-4 text-slate-400" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image Previews Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((url, index) => (
                        <div
                            key={`${url}-${index}`}
                            draggable
                            onDragStart={() => handleReorderDragStart(index)}
                            onDragOver={(e) => handleReorderDragOver(e, index)}
                            onDragEnd={handleReorderDragEnd}
                            className={`
                                group relative aspect-square rounded-lg overflow-hidden border-2
                                cursor-grab active:cursor-grabbing transition-all duration-200
                                ${dragIndex === index
                                    ? 'border-aqua-400 opacity-50 scale-95'
                                    : 'border-slate-200 hover:border-aqua-300'
                                }
                                ${index === 0 ? 'ring-2 ring-aqua-400 ring-offset-1' : ''}
                            `}
                        >
                            <img
                                src={url}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>';
                                }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />

                            {/* Primary badge */}
                            {index === 0 && (
                                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-aqua-500 text-white px-1.5 py-0.5 rounded">
                                    PRIMARY
                                </span>
                            )}

                            {/* Reorder hint */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowsUpDownIcon className="h-4 w-4 text-white drop-shadow" />
                            </div>

                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute bottom-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
