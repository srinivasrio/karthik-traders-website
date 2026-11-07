"use client";

import { useState, useRef, useCallback } from 'react';
import { uploadProductImageAction } from '@/app/actions/uploadImage';
import { supabase } from '@/lib/supabase';
import {
    PhotoIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
    ArrowsUpDownIcon,
    ArrowPathIcon,
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

    const acceptedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/pjpeg', 'image/x-png'];

    const validateFile = (file: File): string | null => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
        const validMime = !file.type || acceptedMimes.includes(file.type.toLowerCase());

        if (!validExt && !validMime) {
            return 'Only JPG, PNG, and WebP images are allowed';
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size must be under ${maxSizeMB}MB`;
        }
        return null;
    };

    const compressImage = async (file: File): Promise<File> => {
        if (!file.type || !file.type.startsWith('image/')) return file;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const maxWidth = 1200;
                        const maxHeight = 1200;
                        let { width, height } = img;
                        if (width > maxWidth || height > maxHeight) {
                            if (width / height > maxWidth / maxHeight) {
                                height = Math.round((height * maxWidth) / width);
                                width = maxWidth;
                            } else {
                                width = Math.round((width * maxHeight) / height);
                                height = maxHeight;
                            }
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                            canvas.toBlob(
                                (blob) => {
                                    if (blob && blob.size < file.size) {
                                        const compressedFile = new File([blob], file.name, {
                                            type: mime,
                                            lastModified: Date.now(),
                                        });
                                        resolve(compressedFile);
                                    } else {
                                        resolve(file);
                                    }
                                },
                                mime,
                                0.85
                            );
                        } else {
                            resolve(file);
                        }
                    } catch (canvasErr) {
                        console.warn('Canvas compression error, using raw file:', canvasErr);
                        resolve(file);
                    }
                };
                img.onerror = () => resolve(file);
                img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    };

    const uploadFile = async (file: File): Promise<{ url: string | null; error?: string }> => {
        try {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('category', category);

            // Attempt 1: Server Action
            try {
                const result = await uploadProductImageAction(formData);
                if (result.success && result.publicUrl) {
                    return { url: result.publicUrl };
                }
                console.warn('Server Action upload returned unsuccessful, falling back to API route:', result.error);
            } catch (actionErr: any) {
                console.warn('Server Action threw exception, falling back to API route:', actionErr?.message);
            }

            // Attempt 2: Direct REST API route fallback with auth token
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch('/api/admin/products/upload-image', {
                method: 'POST',
                headers,
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.publicUrl) {
                    return { url: data.publicUrl };
                }
                return { url: null, error: data.error || 'Upload API returned an error' };
            }

            const errorJson = await res.json().catch(() => ({}));
            return { url: null, error: errorJson.error || `Upload failed (HTTP ${res.status})` };
        } catch (err: any) {
            console.error('Upload error in frontend:', err);
            return { url: null, error: err.message || 'An unexpected upload error occurred' };
        }
    };

    const processUploadList = async (itemsToUpload: UploadingFile[]) => {
        const uploadedUrls: string[] = [];

        for (const item of itemsToUpload) {
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

        setTimeout(() => {
            setUploading(prev => prev.filter(u => u.error));
            if (uploadedUrls.length > 0) {
                onChange([...images, ...uploadedUrls]);
            }
        }, 500);
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
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    preview: URL.createObjectURL(file),
                    progress: 0,
                    error: validationError,
                });
                continue;
            }
            newUploading.push({
                id: Math.random().toString(36).substring(2, 9),
                file,
                preview: URL.createObjectURL(file),
                progress: 25,
            });
        }

        setUploading(prev => [...prev, ...newUploading]);
        await processUploadList(newUploading.filter(u => !u.error));
    }, [images, maxImages, onChange, category]);

    const retryUpload = async (id: string) => {
        const target = uploading.find(u => u.id === id);
        if (!target) return;

        setUploading(prev => prev.map(u => u.id === id ? { ...u, error: undefined, progress: 30 } : u));
        await processUploadList([target]);
    };

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
        const url = prompt('Enter image URL or local path (e.g., /images/products/...):');
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
                    className="text-xs text-aqua-600 hover:text-aqua-700 font-medium hover:underline"
                >
                    + Add URL / Path
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
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
                            {dragOver ? 'Drop images here' : 'Drag & drop images here or browse'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Supports JPG, PNG, WebP • Max {maxSizeMB}MB per image
                        </p>
                    </div>
                </div>
            </div>

            {/* Uploading Progress */}
            {uploading.length > 0 && (
                <div className="space-y-2">
                    {uploading.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <img
                                src={item.preview}
                                alt="Uploading"
                                className="w-10 h-10 rounded object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">
                                    {item.file.name}
                                </p>
                                {item.error ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-red-500">{item.error}</p>
                                        <button
                                            type="button"
                                            onClick={() => retryUpload(item.id)}
                                            className="text-[11px] text-aqua-600 hover:text-aqua-700 font-medium inline-flex items-center gap-0.5"
                                        >
                                            <ArrowPathIcon className="w-3 h-3" /> Retry
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-aqua-500 rounded-full transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeUploadError(item.id)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                                title="Dismiss"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
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
                                cursor-grab active:cursor-grabbing transition-all duration-200 bg-slate-100
                                ${dragIndex === index
                                    ? 'border-aqua-400 opacity-50 scale-95'
                                    : 'border-slate-200 hover:border-aqua-300 shadow-sm'
                                }
                                ${index === 0 ? 'ring-2 ring-aqua-500 ring-offset-1' : ''}
                            `}
                        >
                            <img
                                src={url}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Image Error</text></svg>';
                                }}
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />

                            {/* Primary badge */}
                            {index === 0 && (
                                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-aqua-600 text-white px-1.5 py-0.5 rounded shadow">
                                    PRIMARY
                                </span>
                            )}

                            {/* Reorder hint */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded">
                                <ArrowsUpDownIcon className="h-3.5 w-3.5 text-white" />
                            </div>

                            {/* Delete button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute bottom-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow"
                                title="Remove Image"
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
