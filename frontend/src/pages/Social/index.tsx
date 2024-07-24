import '/app/src/css/style.css'
import Channels from './components/channel'
import Chat from './components/chat'
import Friends from './components/friends'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSocket } from '../../components/Socket'


export default function Social() {
    const [currentChan, setCurrentChan] = useState(null);
    const [login, setLogin] = useState('');
    const [blockeds, setBlocked] = useState([]);

    const socket =  useSocket();

    useEffect(() => {
        if (socket)
            socket.emit("QUIT_QUEUE");
        const url_get_login = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/getLogin`;
        axios.get(url_get_login, {withCredentials: true})
        .then((response) => {
            if (response.data) {
                setLogin(response.data);
            }
        })
        .catch(() => {
            console.log("erreur !");
        })
        const url_blocked = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/blocked?`;
        axios.get(url_blocked, {withCredentials: true})
        .then((response) => {
            if (response.data.usersIds) {
                setBlocked(response.data.usersIds);
            }
            else
                console.log(response.data.error);
        })
        .catch(() => {
            console.log("erreur !");
        })
    }, [socket]);

    useEffect(() => {
        function getLogin () {
            const url_get_login = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/getLogin`;
            axios.get(url_get_login, {withCredentials: true})
            .then((response) => {
                if (response.data) {
                    setLogin(response.data);
                }
            })
            .catch(() => {
                console.log("erreur !");
            })
        }
        if (socket) {
            socket.on("newLogin", getLogin);

        }
    }, [socket]);





    function handleBlock(userId: number) {
        const temp = [...blockeds];
        temp.push(userId);
        setBlocked(temp);
    }

    function handleUnblock(userId: number) {
        const temp = [...blockeds];
        const temp2 = temp.filter((userI) => userI !== userId);
        setBlocked(temp2);
    }

    function handleLeave() {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/leave`;
        const data = {
            login: login,
            name: currentChan.name,
        }
        axios.post(url, data, {withCredentials: true})
        .then(() => {
            setCurrentChan(null);
        })
        .catch(() => {
            console.log("erreur durant le leave");
        })
    }

    function handleDelete() {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/delete`;
        const data = {
            name: currentChan.name,
        }
        axios.post(url, data, {withCredentials: true})
        .then(() => {
            setCurrentChan(null);
        })
        .catch(() => {
            console.log("erreur durant le delete");
        })
    }
    function selectChan(channel: any){
        setCurrentChan(channel);
    }
    return (
        <div>
            {login !== '' &&  socket !== null && <div className="social">
                <Channels handleSelect={(channel: any) => selectChan(channel)} login={login} currentChan={currentChan} socket={socket}/>
                <Chat channel={currentChan} login={login} socket={socket} handleLeave={handleLeave} handleDelete={handleDelete} blockeds={blockeds}/>
                <Friends login={login} blockeds={blockeds} handleBlock={handleBlock} handleUnblock={handleUnblock} socket={socket}/>
            </div> }
            {login !== '' && <span>hello :{login}</span>}
        </div>
    )
}
