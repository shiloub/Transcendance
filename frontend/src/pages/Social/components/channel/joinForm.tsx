import axios from "axios";
import { useState } from "react";
import "/app/src/css/style.css";

export default function JoinForm({onClose, onJoin, login}) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    function handleClick() {
        const url_join_chan = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/join`
        const data = {
            name: name,
            password: password,
            login: login,
        }
        axios.post(url_join_chan, data, {withCredentials: true})
        .then((reponse) => {
            if (reponse.data.channel)
            {
                onJoin(reponse.data.channel);
                onClose();
                setError('');
            }
            else
            {
                setError(reponse.data.error);
            }
        })
        .catch(() => {
            console.log("error");
        });
    }
    return (
        <div className="form">
            <button className="closeButton" onClick={onClose}>x</button>
            <input type="text" placeholder="name" value={name} maxLength={10} onChange={(e) => setName(e.target.value)} />
            <input type="text" placeholder="password" value={password}  maxLength={10} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleClick}>Join</button>
            {error !== '' ? <div>{error}</div> : null}
        </div>
    )
}
