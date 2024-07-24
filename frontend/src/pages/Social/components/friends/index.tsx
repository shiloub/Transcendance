import { useEffect, useState } from "react";
import UserProfile from "./userProfile";
import "/app/src/css/style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function FriendList({list, handleSelect}) {
    return (
        <div>
            <h2>Friend List</h2>
            <ul className="FriendList">
                {list.map((user: any) => (
                    <li key={user.id + "a"} onClick={() => handleSelect(user)}>
                    {user.isConnected ? <span className="green">¤£</span> : <span className="gray">££</span>}
                    {user.login}
                    {user.isInGame && <span> In a game</span>}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function InviteList({list, handleAccept, handleDecline}) {
    return (
        <div>
            <h2>Game Invite List</h2>
            <ul className="gameInviteList">
                {list.map((inviter: any) => (
                    <li key={inviter.username + "a"}>
                    {inviter.login}
                    <button onClick={() => handleAccept(inviter.username)}>Accept</button>
                    <button onClick={() => handleDecline(inviter.username)}>Coward</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default function Friends({login, blockeds, handleBlock, handleUnblock, socket}) {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [inviteList, setInviteList] = useState([]);
    const navigate = useNavigate();


    useEffect (() => {
        const url_friends = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/friends`;
        axios.get(url_friends, {withCredentials: true})
        .then((response) => {
            if (response.data.users) {
                setFriends(response.data.users);
            }
            else
                console.log(response.data.error);
        })
        .catch(() => {
            console.log("error");
        })

    }, [login, socket])

    useEffect (() => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/invite`;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.inviters)
            {
                setInviteList(response.data.inviters);
            }
        })
        .catch(() => {
            console.log("error");
        })
    }, [])

    useEffect(() => {
        const handleConnect = () => {
            const url_friends = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/friends`;
            axios.get(url_friends, {withCredentials: true})
            .then((response) => {
            if (response.data.users) {
                setFriends(response.data.users);
            }
            else
                console.log(response.data.error);
            })
            .catch(() => {
                console.log("error");
            })
        };

        const handleInvited = (by: string) => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/invite`;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.inviters)
            {
                setInviteList(response.data.inviters);
            }
        })
        .catch(() => {
            console.log("error");
        })
        }

        const handleCancel = (by: string) => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/invite`;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.inviters)
            {
                setInviteList(response.data.inviters);
            }
        })
        .catch(() => {
            console.log("error");
        })
        }

        socket.on('connection', handleConnect);
        socket.on('INVITED', handleInvited);
        socket.on('CANCEL_INVITE', handleCancel);

        return () => {
          socket.off('message', handleConnect);
        };
      }, [socket]);

    function handleAdd(user: any) {
        const temp = [...friends];
        temp.push(user);
        setFriends(temp);
    }

    function handleDel(user: any) {
        const temp = [...friends];
        const temp2 = temp.filter((userl) => userl.id !== user.id);
        setFriends(temp2);
    }

    function handleAccept(username: string)
    {
        navigate('/game/1');

        if (socket) {
            const payload = {
                inviter: username
            }
            socket.emit("ACCEPT_INVITATION", payload);
        }
    }

    function handleDecline(username: string) {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/cancelInvite`;
        const data = {
            newLogin: username,
        }
        axios.post(url, data, {withCredentials: true})
        .then(() => {
            const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/invite`;
            axios.get(url, {withCredentials: true})
            .then((response) => {
                if (response.data.inviters)
                {
                    setInviteList(response.data.inviters);
                }
            })

        })
    }


    return (
        <div>
            <UserProfile user={user} setUser={setUser} handleDel={handleDel} handleUnblock={handleUnblock}  handleAdd={handleAdd} handleBlock={handleBlock} login={login} friends={friends} blockeds={blockeds} socket={socket}/>
            <FriendList list={friends} handleSelect={setUser} />
            <InviteList list={inviteList} handleAccept={handleAccept} handleDecline={handleDecline} />

        </div>
    )
}
