import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook que captura el token de refresco de Google cuando el usuario 
 * retorna del flujo OAuth. Se ejecuta al cargar la app.
 */
export const useGoogleTokenCapture = () => {
  const subscriptionRef = useRef<any>(null);
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("🎣 [Global Hook] useGoogleTokenCapture ejecutándose...");

    const setupListener = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("🔄 [Global] Evento:", event);

        // NO hacer nada en eventos de logout
        if (event === 'SIGNED_OUT') {
          console.log("🚪 [Global] Usuario cerró sesión");
          lastTokenRef.current = null;
          return;
        }

        // Capturamos si hay un token de proveedor (provider_refresh_token)
        if (session && session.provider_refresh_token) {
          const newRefreshToken = session.provider_refresh_token;
          
          // Evitar procesar el mismo token dos veces
          if (lastTokenRef.current === newRefreshToken) {
            console.log("⏭️  [Global] Token ya fue procesado, saltando");
            return;
          }

          lastTokenRef.current = newRefreshToken;
          console.log("✅ [Global] Nuevo token detectado:", newRefreshToken.substring(0, 30) + "...");

          try {
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { google_refresh_token: newRefreshToken }
            });

            if (metadataError) {
              console.error("❌ [Global] Error guardando:", metadataError);
            } else {
              console.log("✨ [Global] Token guardado exitosamente");
            }
          } catch (error) {
            console.error("❌ [Global] Error en updateUser:", error);
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
  }, []);
};
