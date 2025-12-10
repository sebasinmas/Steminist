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

export const updateSupportTicketStatus = async (
    ticketId: number,
    status: 'resolved'
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: status })
            .eq('id', ticketId);

        if (error) {
            console.error('Error updating support ticket status:', error);
            throw error;
        }
    } catch (err) {
        console.error('Unexpected error updating support ticket status:', err);
        throw err;
    }
};

export const fetchSupportTickets = async (): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                users:user_id (
                    id,
                    first_name,
                    last_name,
                    avatar_url,
                    role
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching support tickets:', error);
            return [];
        }

        if (!data) return [];

        return data.map(ticket => {
            const user = ticket.users;
            const firstName = user?.first_name || '';
            const lastName = user?.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Usuario Desconocido';

            return {
                id: ticket.id,
                user: {
                    id: user?.id,
                    name: fullName,
                    email: '', // Not strictly needed for card, but part of type
                    role: user?.role || 'mentee',
                    avatarUrl: user?.avatar_url || '',
                },
                subject: ticket.subject,
                message: ticket.message,
                status: ticket.status,
                timestamp: ticket.created_at
            };
        });
    } catch (err) {
        console.error('Unexpected error fetching support tickets:', err);
        return [];
    }
};

