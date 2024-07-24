import axios from "axios";
import "/app/src/css/style.css";
import { useState } from "react";


export default function ChatInput({socket, channel, login}) {
    const [input, setInput] = useState('');

    function handleClick(){

        if (input.length === 0)
            return;

        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/users?name=` + channel.name
        axios.get(url, {withCredentials: true})
        .then((reponse) => {
            if (reponse.data.users)
            {
                const payload = {
                    channelName: channel.name,
                    senderLogin: login,
                    content: input,
                    userList: reponse.data.users,
                }
                socket.emit('message', payload);
                setInput('');
            }
        })
        .catch(() => {
            console.log("error");
        })
    }
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleClick();
        }

    }

    return (
        <div>
            <input type="text" placeholder="message" value={input} maxLength={255} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} />
            <button onClick={handleClick}>Send</button>
        </div>
    )

}
