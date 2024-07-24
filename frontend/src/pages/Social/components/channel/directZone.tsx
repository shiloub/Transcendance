import { useEffect, useState } from "react";
import ChanList from "./chanList";
import axios from "axios";
import CreateDirectForm from "./createDirectForm";

export default function DirectZone({handleSelect, login}) {
    const [createForm, setCreateForm] = useState(false);
    const [chanList, setChanList] = useState([])

    useEffect(() => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/direct`;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            setChanList(response.data.channels);
        })
        .catch((error) => {
            console.error("Erreur lors de la récupération des direct : ", error);
        });
    }, [login])

    function addChannel(channel: any) {
        const temp = [...chanList];
        temp.push(channel);
        setChanList(temp);
    }

    return (
        <div>
            <h2>Direct</h2>
            <button onClick={() => {setCreateForm(!createForm)}}>Start chat</button>
            {createForm ? <CreateDirectForm onClose={() => setCreateForm(false)} login={login} onCreateDirect={(channel: any) => addChannel(channel)} />: null}
            <ChanList list={chanList} handleSelect={handleSelect} login={login}/>
        </div>
    )
}
