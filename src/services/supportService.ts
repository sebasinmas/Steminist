import { supabase } from '../lib/supabase';

export interface CreateSupportTicketData {
    user_id: string;
    subject: string;
    message: string;
}

export interface SupportTicketResponse {
    id: number;
    user_id: string;
    subject: string;
    message: string;
    status: string;
    priority: string | null;
    assigned_admin_id: string | null;
    created_at: string;
    updated_at: string | null;
    closed_at: string | null;
}

export const createSupportTicket = async (
    userId: string,
    subject: string,
    message: string
): Promise<SupportTicketResponse> => {
    try {
        const ticketData: CreateSupportTicketData = {
            user_id: userId,
            subject: subject,
            message: message,
        };

        const { data, error } = await supabase
            .from('support_tickets')
            .insert(ticketData)
            .select()
            .single();

        if (error) {
            console.error('Error creating support ticket:', error);
            throw error;
        }

        if (!data) {
            throw new Error('No data returned from support ticket creation');
        }

        return data as SupportTicketResponse;
    } catch (err) {
        console.error('Unexpected error creating support ticket:', err);
        throw err;
    }
};

