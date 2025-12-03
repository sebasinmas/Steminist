export const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Crear URL temporal
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      // Dibujar imagen
      ctx.drawImage(img, 0, 0);

      // Convertir a Blob (WebP)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl); // Limpiar memoria
          if (blob) resolve(blob);
          else reject(new Error('Error al convertir la imagen a WebP'));
        },
        'image/webp',
        0.8 // Calidad (0 a 1)
      );
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
  });
};