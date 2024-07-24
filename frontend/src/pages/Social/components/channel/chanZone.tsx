import { useEffect, useState } from "react";
import CreateForm from "./createForm";
import ChanList from "./chanList";
import axios from "axios";
import JoinForm from "./joinForm";

export default function ChanZone({handleSelect, login, currentChan, kicked}) {
    const [createForm, setCreateForm] = useState(false);
    const [joinForm, setJoinForm] = useState(false);
    const [chanList, setChanList] = useState([]);

    useEffect(() => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/mine?login=` + login;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.channels)
            {
                setChanList(response.data.channels);
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la récupération des canaux : ", error);
        });         
    }, [login, currentChan, kicked])

    function addChannel(channel: any) {
        const temp = [...chanList];
        temp.push(channel);
        setChanList(temp);
    }

    return (
        <div>
            <h2>Channels</h2>
            <button onClick={() => {setCreateForm(!createForm); setJoinForm(false)}}>Create</button>
            <button onClick={() => {setJoinForm(!joinForm); setCreateForm(false)}}>Join</button>
            {createForm ? <CreateForm onClose={() => setCreateForm(false)}login={login} onCreate={(channel: any) => addChannel(channel)} />: null}
            {joinForm? <JoinForm onClose={() => setJoinForm(false)} login={login} onJoin={(channel: any) => addChannel(channel)}/>: null}
            <ChanList list={chanList} handleSelect={handleSelect} login={login}/>
        </div>
    )
}

// {createForm ? <CreateForm onCancel={() => {setCreateForm(false)}} login={login} onCreate={(channel: any) => addChannel(channel)} />: null}
