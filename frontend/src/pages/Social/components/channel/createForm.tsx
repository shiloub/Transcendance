import axios from "axios";
import { useState } from "react";
import "/app/src/css/style.css";

export default function CreateForm({onClose, onCreate, login}) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('PUBLIC');
    const [error, setError] = useState('');
    function handleClick() {
        const url_create_chan = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/create`
        const data = {
            name: name,
            type: type,
            password: password,
            creatorLogin: login,
        }
        axios.post(url_create_chan, data, {withCredentials: true})
        .then((reponse) => {
            if (reponse.data.channel)
            {
                onCreate(reponse.data.channel);
                onClose();
                setError('');
            }
            else {
                setError(reponse.data.error);
            }
        })
        .catch(function(error) {
            console.error(error);
        });
    }
    return (
        <div className="form">
            <button onClick={onClose} className="closeButton">x</button>
            <select name="witchType" defaultValue="PUBLIC" onChange={(e) => setType(e.target.value)}>
                <option value="PUBLIC">public</option>
                <option value="PRIVATE">private</option>
            </select>
            <input type="text" placeholder="name" value={name} maxLength={10} onChange={(e) => setName(e.target.value)} />
            <input type="password" placeholder="password" value={password} maxLength={10} onChange={(e) => setPassword(e.target.value)} />
            <div>
                <button onClick={handleClick}>Create</button>
                {/* <button onClick={onCancel}>Cancel</button> */}
            </div>
            {error !== '' ? <div>{error}</div> : null}
        </div>
    )
}
