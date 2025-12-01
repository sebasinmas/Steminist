import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

/**
 * Hook que captura silenciosamente el token de refresco de Google 
 * y notifica al usuario cuando la sincronización es exitosa.
 */
export const useGoogleTokenCapture = () => {
  const subscriptionRef = useRef<any>(null);
  const lastTokenRef = useRef<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const setupListener = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        
        // Reiniciamos referencia si el usuario cierra sesión
        if (event === 'SIGNED_OUT') {
          lastTokenRef.current = null;
          return;
        }

        // Verificamos si Google nos envió un refresh token nuevo
        if (session && session.provider_refresh_token) {
          const newRefreshToken = session.provider_refresh_token;
          
          // Evitamos procesar el mismo token múltiples veces en la misma sesión
          if (lastTokenRef.current === newRefreshToken) {
            return;
          }

          lastTokenRef.current = newRefreshToken;

          try {
            // Guardamos el token en los metadatos del usuario
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { google_refresh_token: newRefreshToken }
            });

            if (metadataError) {
              console.error("Error guardando token de Google:", metadataError);
              addToast('No se pudo guardar la sincronización.', 'error');
            } else {
              //Mostramos el mensaje al usuario
              addToast('Sincronización de calendario exitosa', 'success');
            }
          } catch (error) {
            console.error("Excepción al actualizar usuario:", error);
          }
        }
      });

      subscriptionRef.current = subscription;
    };

    setupListener();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [addToast]);
};