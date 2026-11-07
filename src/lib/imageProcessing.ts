// Auto-corta para 1:1 quadrado (usado para autores e avatares)
export function autoCropImageToSquare(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl.startsWith('data:image/svg')) {
      resolve(imageUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        if (img.naturalWidth === img.naturalHeight && !imageUrl.startsWith('blob:')) {
          resolve(imageUrl);
          return;
        }
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const targetSize = Math.min(1024, Math.max(512, minDim));
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('Could not auto-crop image', err);
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

// Auto-corta para proporção 1.6:1 (altura / largura) - formato padrão de ebooks
export function autoCropImageToEbookCover(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl.startsWith('data:image/svg')) {
      resolve(imageUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const ratio = img.naturalHeight / img.naturalWidth;
        if (Math.abs(ratio - 1.6) < 0.02 && !imageUrl.startsWith('blob:')) {
          resolve(imageUrl);
          return;
        }
        const canvas = document.createElement('canvas');
        let sWidth = img.naturalWidth;
        let sHeight = img.naturalHeight;
        let sx = 0;
        let sy = 0;

        if (ratio > 1.6) {
          // Imagem mais alta que 1.6:1 -> corta topo e base igualmente
          sHeight = Math.round(img.naturalWidth * 1.6);
          sy = Math.round((img.naturalHeight - sHeight) / 2);
        } else {
          // Imagem mais larga que 1.6:1 -> corta laterais igualmente
          sWidth = Math.round(img.naturalHeight / 1.6);
          sx = Math.round((img.naturalWidth - sWidth) / 2);
        }

        const targetW = Math.min(1000, Math.max(500, sWidth));
        const targetH = Math.round(targetW * 1.6);
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('Could not auto-crop ebook cover', err);
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

