import { supabase } from '../lib/supabase';

export const mentorshipAdminService = {
  // 1) Lo llama el dashboard cuando la mentora/mentoreada envía la solicitud
  requestTermination: async (
    mentorshipId: number,
    reasons: string[],
    details: string
  ) => {
    const terminationReason = [
      reasons.length ? `Motivos: ${reasons.join(', ')}` : '',
      details ? `Detalles: ${details}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const { data, error } = await supabase
      .from('mentorships')
      .update({
        status: 'termination_requested',
        termination_reason: terminationReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 2) Lo llama el admin al confirmar la terminación
  confirmTermination: async (mentorshipId: number) => {
    const { data, error } = await supabase
      .from('mentorships')
      .update({
        status: 'terminated',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 3) Lo llama el admin al denegar la terminación (volver a active, pero conservar razón)
  denyTermination: async (mentorshipId: number) => {
    const { data, error } = await supabase
      .from('mentorships')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorshipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};