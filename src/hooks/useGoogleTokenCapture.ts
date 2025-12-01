import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook que captura el token de refresco de Google cuando el usuario 
 * retorna del flujo OAuth. Se ejecuta al cargar la app.
 */
export const useGoogleTokenCapture = () => {
  useEffect(() => {
    console.log("🎣 [Global Hook] useGoogleTokenCapture ejecutándose...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [Global] Evento de autenticación:", event);

      // Capturamos CUALQUIER evento que traiga un token nuevo
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session) {
        console.log("✅ [Global] Evento válido:", event);

        const newRefreshToken = session.provider_refresh_token;
        
        if (newRefreshToken) {
          console.log("📌 [Global] Token capturado:", newRefreshToken.substring(0, 30) + "...");

          // Guardamos en user_metadata
          console.log("💾 [Global] Guardando token en user_metadata...");
          const { error: metadataError } = await supabase.auth.updateUser({
            data: { google_refresh_token: newRefreshToken }
          });

          if (metadataError) {
            console.error("❌ [Global] Error guardando en user_metadata:", metadataError);
          } else {
            console.log("✅ [Global] Token guardado exitosamente");
            console.log("✨ [Global] Token final:", newRefreshToken.substring(0, 30) + "...");
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
