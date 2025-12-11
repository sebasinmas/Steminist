// src/services/ratingService.ts
import { supabase } from '../lib/supabase';

export const ratingService = {
    // 1. Actualizar Rating de Mentora (Basado en session_feedback)
    updateMentorRating: async (mentorId: string | number) => {
        try {
            // A. Obtener todos los feedbacks recibidos por esta mentora
            // Necesitamos unir con la tabla sessions para filtrar por mentor_id,
            // ya que session_feedback solo tiene session_id.
            const { data: feedbacks, error: fetchError } = await supabase
                .from('session_feedback')
                .select(`
                    rating,
                    sessions!inner(mentor_id)
                `)
                .eq('sessions.mentor_id', mentorId);

            if (fetchError) throw fetchError;

            if (!feedbacks || feedbacks.length === 0) return;

            // B. Calcular promedio
            const totalReviews = feedbacks.length;
            const sumRatings = feedbacks.reduce((acc, item) => acc + (item.rating || 0), 0);
            const averageRating = sumRatings / totalReviews;

            // C. Actualizar perfil de mentora
            const { error: updateError } = await supabase
                .from('mentor_profiles')
                .update({
                    average_rating: averageRating,
                    total_reviews: totalReviews
                })
                .eq('user_id', mentorId);

            if (updateError) throw updateError;

            console.log(`Rating de mentora actualizado: ${averageRating} (${totalReviews} reviews)`);

        } catch (error) {
            console.error('Error actualizando rating de mentora:', error);
        }
    },

    // 2. Actualizar Rating de Mentoreada (Basado en private_session_surveys)
    updateMenteeRating: async (menteeId: string | number) => {
        try {
            // A. Obtener todas las encuestas realizadas a esta mentoreada
            // Unimos con sessions para filtrar por mentee_id
            const { data: surveys, error: fetchError } = await supabase
                .from('private_session_surveys')
                .select(`
                    preparation,
                    engagement,
                    sessions!inner(mentee_id)
                `)
                .eq('sessions.mentee_id', menteeId);

            if (fetchError) throw fetchError;

            if (!surveys || surveys.length === 0) return;

            // B. Calcular promedio
            // Asumimos que preparation y engagement se guardan como números (1-4) en la BD 
            // gracias a la conversión en mentorshipService.
            const totalReviews = surveys.length;
            
            const sumScores = surveys.reduce((acc, item) => {
                // Promedio simple de preparación y compromiso por sesión
                const sessionScore = ((item.preparation || 0) + (item.engagement || 0)) / 2;
                return acc + sessionScore;
            }, 0);

            const averageRating = sumScores / totalReviews;

            // C. Actualizar perfil de mentoreada
            // NOTA: Asegúrate de tener estas columnas en 'mentee_profiles'
            const { error: updateError } = await supabase
                .from('mentee_profiles')
                .update({
                    average_rating: averageRating,
                    total_reviews: totalReviews
                })
                .eq('user_id', menteeId);

            if (updateError) throw updateError;

            console.log(`Rating de mentoreada actualizado: ${averageRating} (${totalReviews} reviews)`);

        } catch (error) {
            console.error('Error actualizando rating de mentoreada:', error);
        }
    }
};