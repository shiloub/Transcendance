import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Effectuer la requête pour obtenir l'utilisateur actuellement authentifié
    axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/me`, { withCredentials: true })
      .then((response) => {

        // Une fois que vous avez les informations de l'utilisateur, configurez la socket WebSocket
        const username = response.data.username;
        const socketInstance = io(`http://${process.env.REACT_APP_CURRENT_HOST}:3001`, {
          query: {
            username: username
          }
        });
        
        setSocket(socketInstance);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération de l'utilisateur : ", error);
      });
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
