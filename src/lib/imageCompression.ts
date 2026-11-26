/**
 * Client-side image compression for Barnali Fashion ERP.
 * Downscales camera photos and compresses to JPEG under the server limit (400 KB).
 */

export interface CompressedImage {
  blob: Blob;
  contentType: "image/jpeg";
  bytes: number;
}

export async function compressImage(
  file: File,
  maxDimension = 1600,
  maxBytes = 390 * 1024
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    // If the image is already a small JPEG/WebP under 300KB, we can still normalize it
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context for compression"));
        return;
      }

      // Draw with white background in case of PNG transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.82;

      const tryCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob failed"));
              return;
            }

            if (blob.size <= maxBytes || q <= 0.4) {
              resolve({
                blob,
                contentType: "image/jpeg",
                bytes: blob.size,
              });
            } else {
              // Try higher compression
              tryCompress(Math.max(0.4, q - 0.15));
            }
          },
          "image/jpeg",
          q
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}
