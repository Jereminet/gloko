/**
 * Resizes and compresses an image file to high resolution (default 1080px)
 * while ensuring the base64 output stays safely within Firestore's 512KB field limit.
 */
export function resizeImage(file: File, maxDimension: number = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DATA_URL_LENGTH = 420000;
        let currentMaxDim = maxDimension;
        const qualities = [0.86, 0.78, 0.7];

        const renderAt = (dim: number, quality: number): string => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > dim) {
              height = Math.round((height * dim) / width);
              width = dim;
            }
          } else {
            if (height > dim) {
              width = Math.round((width * dim) / height);
              height = dim;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return (e.target?.result as string) || '';
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', quality);
        };

        let dataUrl = renderAt(currentMaxDim, qualities[0]);
        if (dataUrl.length > MAX_DATA_URL_LENGTH) {
          for (const q of qualities.slice(1)) {
            dataUrl = renderAt(currentMaxDim, q);
            if (dataUrl.length <= MAX_DATA_URL_LENGTH) break;
          }
        }
        while (dataUrl.length > MAX_DATA_URL_LENGTH && currentMaxDim > 360) {
          currentMaxDim = Math.round(currentMaxDim * 0.75);
          dataUrl = renderAt(currentMaxDim, 0.72);
        }

        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image.'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    reader.readAsDataURL(file);
  });
}
