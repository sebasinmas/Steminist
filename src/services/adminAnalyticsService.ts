import { supabase } from '../lib/supabase';

export interface AdminMetrics {
  totalMentees: number;
  totalMentors: number;
  activeMentorships: number;
  completedMentorships: number;
  avgMentorRating: string; // 'N/A' o número formateado
}

export const adminAnalyticsService = {
  fetchMetrics: async (): Promise<AdminMetrics> => {
    // 1) Total de mentoreadas
    const { count: menteesCount, error: menteesError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'mentee');

    if (menteesError) throw menteesError;

    // 2) Total de mentoras
    const { count: mentorsCount, error: mentorsError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'mentor');

    if (mentorsError) throw mentorsError;

    // 3) Mentorías activas / completadas
    const { data: mentorshipsData, error: mentorshipsError } = await supabase
      .from('mentorships')
      .select('status');

    if (mentorshipsError) throw mentorshipsError;

    const activeMentorships =
      mentorshipsData?.filter(m => m.status === 'active').length ?? 0;
    const completedMentorships =
      mentorshipsData?.filter(m => m.status === 'completed').length ?? 0;

    // 4) Rating promedio de mentoras (ponderado por total_reviews)
    const { data: mentorProfiles, error: mentorProfilesError } = await supabase
      .from('mentor_profiles')
      .select('average_rating, total_reviews');

    if (mentorProfilesError) throw mentorProfilesError;

    const rated = (mentorProfiles || []).filter(
      mp => (mp.average_rating as number) > 0 && (mp.total_reviews as number) > 0
    );

    let avgMentorRating = 'N/A';
    if (rated.length > 0) {
      const totalWeighted = rated.reduce(
        (sum, mp: any) => sum + Number(mp.average_rating) * Number(mp.total_reviews),
        0
      );
      const totalReviews = rated.reduce(
        (sum, mp: any) => sum + Number(mp.total_reviews),
        0
      );
      avgMentorRating = (totalWeighted / totalReviews).toFixed(2);
    }

    return {
      totalMentees: menteesCount ?? 0,
      totalMentors: mentorsCount ?? 0,
      activeMentorships,
      completedMentorships,
      avgMentorRating,
    };
  },
};