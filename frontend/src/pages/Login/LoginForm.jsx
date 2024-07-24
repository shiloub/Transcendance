import "/app/src/css/style.css";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom'

export default function LoginForm() {

	const [twoFaSecret, setTwoFaSecret] = useState("");

	const [twoFaActivation, setTwoFaActivation] = useState(false);

	const [twoFaCookieState, setTwoFaCookieState] = useState(false);

	const [isSigned, setIsSigned] = useState(false);

	const [refreshPage, setRefreshPage] = useState(0);

	const [authorized, setAuthorized] = useState(false);

	function handleSignup() {
		//let page = await axios.get('http:// HOST :3001', { withCredentials: true });
		window.location.href = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/login42`;
	};

    useEffect(() => {

        const checkIsSigned = async () => {
            try {
                await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_is_signed`, { withCredentials: true });
				setIsSigned(true);
				return true;
            } catch (error) {
				setIsSigned(false);
            }
        };

        const getTwoFaActivationState = async () => {
            try {
                await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_2fa_activation`, { withCredentials: true });
				setTwoFaActivation(true);
            } catch (error) {
				setTwoFaActivation(false);
            }
        };

        const getTwoFaCookieState = async () => {
            try {
                await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_2fa_cookie`, { withCredentials: true });
				setTwoFaCookieState(true);
            } catch (error) {
				setTwoFaCookieState(false);
            }
        };

        const checkIfAuthorized = async () => {
            try {
                await axios.get(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/check_authorized`, { withCredentials: true });
				setAuthorized(true);
            } catch (error) {
				setAuthorized(false);
            }
        };

		checkIsSigned()
		.then( () => getTwoFaActivationState())
		.then( () => getTwoFaCookieState())
		.catch((error) => {});


		checkIfAuthorized()
		.catch((error) => {});

    }, [refreshPage]);

	const handleChangeText = (event) => {
		setTwoFaSecret(event.target.value);
	};


	const handleSubmitAuthentication = async (event) => {
		event.preventDefault();

		try {
			await axios.post(`http://${process.env.REACT_APP_CURRENT_HOST}:3001/auth/2fa_authenticate`,{ twoFactorCode: twoFaSecret } ,{ withCredentials: true });
			setRefreshPage(42);
			window.location.href = `http://${process.env.REACT_APP_CURRENT_HOST}:3000/bonus`;
		} catch (error) {
			//console.log('handleSubmit', error.response.data.message, error.response.data);
		}

	};

	if (authorized) {
		return (
			<Navigate to="/bonus" replace />
		);
	};

	return (
		<>

		<div className="start_page">
		{ twoFaActivation && !twoFaCookieState &&
			<div>
			<h2>PLEASE AUTHENTICATE 2FA</h2>
			<form onSubmit={handleSubmitAuthentication}>
			<input type="text" value={twoFaSecret} onChange={handleChangeText} />
			<button type="submit">Submit</button>
			</form>
			</div>
		}

		{!isSigned &&
				<div className="connect_button">
				<h2>Welcome to transcendance</h2>
				<button onClick={handleSignup}>CONNECT</button>
				</div>
		}
		</div>

		</>
	);
}
