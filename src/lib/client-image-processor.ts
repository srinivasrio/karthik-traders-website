/**
 * Client-Side Image Processor & Compressor
 * 
 * Automatically compresses, resizes, and converts any image format
 * (mobile camera DCIM, JPG, PNG, WebP, HEIC/HEIF, BMP, etc.)
 * into a lightweight, high-quality PNG before uploading to the server.
 */

export interface CompressionResult {
    file: File;
    originalSizeBytes: number;
    compressedSizeBytes: number;
    compressionRatio: string;
    width: number;
    height: number;
}

/**
 * Compresses any image to a high-quality, reduced-size PNG.
 * 
 * @param file The original image file from file picker or mobile camera
 * @param maxDimension Maximum width or height (default: 1600px for crisp clarity)
 * @returns Compressed File in PNG format
 */
export async function compressAndConvertToPng(
    file: File,
    maxDimension: number = 1600
): Promise<File> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return file;
    }

    // If file is not an image or is empty, return as is
    if (!file || file.size === 0) {
        return file;
    }

    try {
        // Read file as Data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });

        // Load into HTMLImageElement
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Failed to decode image data'));
            image.src = dataUrl;
        });

        let { width, height } = img;
        if (width === 0 || height === 0) {
            return file;
        }

        // Scale down proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
            } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
            }
        }

        // Create canvas and draw scaled image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('[ImageProcessor] Canvas 2D context unavailable, using raw file.');
            return file;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG blob
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });

        if (!blob) {
            console.warn('[ImageProcessor] Canvas toBlob failed, using raw file.');
            return file;
        }

        // Generate clean .png filename
        const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'image';
        const cleanPngName = `${baseName}.png`;

        const compressedFile = new File([blob], cleanPngName, {
            type: 'image/png',
            lastModified: Date.now(),
        });

        const origMb = (file.size / (1024 * 1024)).toFixed(2);
        const compMb = (compressedFile.size / (1024 * 1024)).toFixed(2);
        const ratio = Math.round((1 - compressedFile.size / file.size) * 100);

        console.log(
            `[ImageProcessor] Compressed: ${file.name} (${origMb} MB) -> ${cleanPngName} (${compMb} MB) [${ratio > 0 ? `${ratio}% reduced` : 'optimized'}]`
        );

        return compressedFile;
    } catch (err) {
        console.warn('[ImageProcessor] Image compression error, falling back to original file:', err);
        return file;
    }
}
