import { supabase } from '../lib/supabase';
import { convertToWebP } from '../utils/imageConverter';

// Nombre exacto de tu bucket en Supabase (debe ser minúscula si así lo creaste)
const BUCKET_NAME = 'avatars'; 

export const storageService = {
    uploadAvatar: async (userId: string | number, file: File): Promise<string> => {
        try {
            // 1. Convertir a WebP para estandarizar
            const webpBlob = await convertToWebP(file);
            
            // 2. Nombre consistente: ID del usuario + extensión .webp
            const fileName = `${userId}.webp`;

            // 3. Subir (Upsert = true para sobrescribir)
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, webpBlob, {
                    upsert: true,
                    contentType: 'image/webp',
                    cacheControl: '3600'
                });

            if (uploadError) throw uploadError;

            // 4. Obtener URL Pública
            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            // 5. Truco clave: Agregar timestamp para evitar caché del navegador
            // Si no haces esto, el usuario sube la foto nueva pero sigue viendo la vieja
            return `${data.publicUrl}?t=${Date.now()}`;

        } catch (error) {
            console.error('Error en storageService:', error);
            throw error;
        }
    }
};