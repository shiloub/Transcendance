import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom'
import axios from 'axios';

const RouteProtection = (props) => {

    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {

        const checkAuthentication = async () => {

			try {
				await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_auth_cookie`, { withCredentials: true });
			} catch {
				setIsAuthenticated(false);
				try {
				await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/delete_all_cookies`, { withCredentials: true });
				} catch {
				}
			}

			try {
				await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_2fa_cookie`, { withCredentials: true });
			} catch {
				setIsAuthenticated(false);
				try {
				await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/delete_2FA_cookie`, { withCredentials: true });
				} catch {
				}
			}

			setIsAuthenticated(true);
        };


        checkAuthentication();
    }, []);

    if (isAuthenticated === null) {
        return <p>Vérification en cours...</p>;  // Affiche un message pendant la vérification
    }

	if (isAuthenticated)
		return props.children;

	else
		return <Navigate to="/login" replace /> 

}

export default RouteProtection;
