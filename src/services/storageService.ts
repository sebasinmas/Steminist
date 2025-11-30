import { supabase } from '../lib/supabase';

export const storageService = {
    uploadAvatar: async (userId: string | number, file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                upsert: true
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
