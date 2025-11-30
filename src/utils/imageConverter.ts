export const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 1. Crear URL temporal para leer el archivo
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // 2. Crear un Canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 3. Dibujar la imagen en el canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      // 4. Exportar como Blob WebP (calidad 0.8)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Error al convertir imagen'));
      }, 'image/webp', 0.8);
    };

    img.onerror = (error) => reject(error);
  });
};