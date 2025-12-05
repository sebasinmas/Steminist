import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import Tooltip from './Tooltip';

const GoogleCalendarButton: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isAlreadySynced, setIsAlreadySynced] = useState<boolean>(false);

  // Verificar si el usuario ya sincronizó Google Calendar
  useEffect(() => {
    const checkGoogleSync = async () => {
      if (!user?.id) return;

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const googleRefreshToken = authUser?.user_metadata?.google_refresh_token;
        
        if (googleRefreshToken) {
          console.log("✅ [GoogleCalendar] Usuario ya tiene token sincronizado");
          setIsAlreadySynced(true);
        } else {
          console.log("🔓 [GoogleCalendar] Usuario aún no sincroniza Google");
          setIsAlreadySynced(false);
        }
      } catch (error) {
        console.error("Error verificando sincronización:", error);
      }
    };

    checkGoogleSync();
  }, [user?.id]);

  const handleLinkCalendar = async () => {
    console.log("🎬 [Button] Usuario hace clic en 'Conectar Google Calendar'");
    
    setLoading(true);
    setErrorMsg('');

    try {
      console.log("🔐 [Button] Iniciando flujo OAuth con Google...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      console.log("✅ [Button] Redirigiendo a Google...");

    } catch (error: unknown) {
      console.error("❌ [Button] Error en OAuth:", error);
      
      let message = 'Error al conectar. Intenta de nuevo.';
      if (error instanceof Error) {
        message = error.message;
      }
      
      setErrorMsg(message);
      setLoading(false);
    }
  };

  const buttonContent = (
    <Button 
      onClick={handleLinkCalendar}
      disabled={loading || isAlreadySynced}
      variant="secondary"
      size="md"
      className="gap-3"
    >
      {/* Logo de Google SVG */}
      <svg className="w-5 h-5" viewBox="0 0 18 18">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fillRule="evenodd" fillOpacity="1" fill="#4285f4" stroke="none"></path>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fillRule="evenodd" fillOpacity="1" fill="#34a853" stroke="none"></path>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fillRule="evenodd" fillOpacity="1" fill="#fbbc05" stroke="none"></path>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.271C4.672 5.14 6.656 3.58 9 3.58z" fillRule="evenodd" fillOpacity="1" fill="#ea4335" stroke="none"></path>
      </svg>

      <span>
        {loading ? 'Redirigiendo a Google...' : isAlreadySynced ? '✓ Sincronizado' : 'Conectar Google Calendar'}
      </span>
    </Button>
  );

  return (
    <div className="flex flex-col items-start gap-2">
      {isAlreadySynced ? (
        <Tooltip position="right" content="Ya sincronizaste tu cuenta">
          <div className="w-full">
            {buttonContent}
          </div>
        </Tooltip>
      ) : (
        <Tooltip position="right" content="Al sincronizar, todas tus sesiones agendadas se agregarán a tu calendario de Google">
          <div className="w-full">
            {buttonContent}
          </div>
        </Tooltip>
      )}

      {/* Mensaje de error */}
      {errorMsg && (
        <p className="text-sm text-red-500 font-medium ml-1 animate-pulse">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default GoogleCalendarButton;