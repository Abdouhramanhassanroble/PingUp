import { useEffect, useRef } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export const useJitsi = (roomName: string, userName: string, domain = "meet.jit.si") => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Fonction pour nettoyer l'instance Jitsi
    const cleanup = () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (error) {
          console.warn('Erreur lors de la fermeture de Jitsi:', error);
        }
        apiRef.current = null;
      }
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = "";
      }
    };

    // Charger le script si ce n'est pas encore fait
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        if (isMounted) {
          startMeeting();
        }
      };
      script.onerror = () => {
        console.error('Échec du chargement de Jitsi Meet');
      };
      document.body.appendChild(script);
    } else {
      startMeeting();
    }

    function startMeeting() {
      if (!isMounted || !jitsiContainerRef.current) return;

      cleanup(); // Nettoyer toute instance précédente

      try {
        const options = {
          roomName: roomName.replace(/[^a-zA-Z0-9-_]/g, ''), // Nettoyer le nom de la salle
          parentNode: jitsiContainerRef.current,
          width: "100%",
          height: 600,
          userInfo: {
            displayName: userName,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            defaultLanguage: 'fr',
            toolbarButtons: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'settings', 'videoquality',
              'filmstrip', 'feedback', 'stats', 'shortcuts'
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
            APP_NAME: 'PingUp',
            NATIVE_APP_NAME: 'PingUp',
            DEFAULT_BACKGROUND: '#667eea',
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        
        // Ajouter des listeners pour les événements
        apiRef.current.addEventListeners({
          readyToClose: () => {
            console.log('Jitsi prêt à fermer');
          },
          participantLeft: (participant: any) => {
            console.log('Participant parti:', participant);
          },
          participantJoined: (participant: any) => {
            console.log('Participant rejoint:', participant);
          },
        });

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de Jitsi:', error);
      }
    }

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [roomName, userName, domain]);

  return jitsiContainerRef;
};
export default useJitsi;