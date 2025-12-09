import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useProfileOptions = () => {
    const [interests, setInterests] = useState<string[]>([]);
    const [mentorshipGoals, setMentorshipGoals] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);

                // Fetch interests
                const { data: interestsData, error: interestsError } = await (supabase
                    .rpc as any)('get_enum_values', { enum_name: 'interest_enum' });

                if (interestsError) throw interestsError;

                // Fetch mentorship goals
                const { data: goalsData, error: goalsError } = await (supabase
                    .rpc as any)('get_enum_values', { enum_name: 'mentorship_goal_enum' });

                if (goalsError) throw goalsError;

                // Map results to array of strings
                // The RPC returns an array of objects like [{ value: 'data_science' }, ...]
                // We need to extract the 'value' property.
                // Note: The RPC definition returns TABLE (value text), so data is [{value: '...'}, ...]

                setInterests((interestsData as any[] || []).map(item => item.value));
                setMentorshipGoals((goalsData as any[] || []).map(item => item.value));

            } catch (err: any) {
                console.error('Error fetching profile options:', err);
                setError(err.message || 'Failed to load options');
                // Fallback to empty arrays or handle gracefully
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, []);

    return { interests, mentorshipGoals, loading, error };
};
