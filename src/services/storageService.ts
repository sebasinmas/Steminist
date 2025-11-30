import { convertToWebP } from '../utils/imageConverter';
import { supabase } from '../lib/supabase';

export const storageService = {
    uploadAvatar: async (userId: string | number, file: File): Promise<string> => {
        const webpBlob = await convertToWebP(file);
        const fileName = `${userId}.webp`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, webpBlob, {
                upsert: true,
                contentType: 'image/webp'
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }
};
