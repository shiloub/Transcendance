import axios from "axios";
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import "/app/src/css/style.css";

function Profile({user, login, handleAdd, handleDel, handleBlock, handleUnblock, blockeds, friends, socket}) {
    const isFriend = friends.some(friend => friend.id === user.id);
    console.log(isFriend);
    const navigate = useNavigate();

    function handleClickAdd () {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/addFriend`;
        const data = {
            login: login,
            target: user.login,
        }
        axios.post(url, data, {withCredentials: true})
        .then((response) => {
            if (response.data.added)
                handleAdd(response.data.added);
            else
                console.log(response.data.error);
        })
        .catch((error) => {
            console.log(error);
        })
    }

    function handleClickDell () {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/DelFriend`;
        const data = {
            login: login,
            target: user.login,
        }
        axios.post(url, data, {withCredentials: true})
        .then((response) => {
            if (response.data.deleted)
                handleDel(response.data.deleted);
        })
        .catch((error) => {
            console.log(error);
        })
    }

    function handleClickBlock () {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/blockUser`;
        const data = {
            login: login,
            target: user.login,
        }
        axios.post(url, data, {withCredentials: true})
        .then((response) => {
            if (response.data.blocked)
            handleBlock(response.data.blocked.id);
        })
        .catch((error) => {
            console.log(error);
        })
    }

    function handleClickUnblock () {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/unblockUser`;
        const data = {
            login: login,
            target: user.login,
        }
        axios.post(url, data, {withCredentials: true})
        .then((response) => {
            if (response.data.unblocked)
            handleUnblock(response.data.unblocked.id);
        })
        .catch((error) => {
            console.log(error);
        })
    }


    function handleChallenge() {
        if (socket){
            const payload = {
                targetUsername: user.username,
            }
            navigate('/game/1');
            socket.emit("INVITE_PLAYER", payload);
            // socket.emit("FIND_GAME", 0);

        }
    }

    return (
        <div className="profilefiche">
            <h3>{user.login}</h3>
            <div className="addblock">
                {!isFriend ? <button onClick={() => handleClickAdd()}>+</button> : <button onClick={() => handleClickDell()}>-</button>}
                {!blockeds.includes(user.id) ? <button onClick={() => handleClickBlock()}>Block</button> : <button onClick={() => handleClickUnblock()}>unblock</button>}
            </div>
            <div className="linkchall">
                <Link to={`/Profile/${user.id}`}>Profile</Link>
                <button onClick={() => handleChallenge()}>Challenge !</button>

            </div>
        </div>
    )
}

export default function UserProfile({user, setUser, handleAdd, handleUnblock, handleDel, handleBlock, login, blockeds, friends, socket}) {
    const [input, setInput] = useState('');

    function handleSearch() {
        if (input === login) {
            setInput("");
            return
        }
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/other?login=` + input;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.user){
                setUser(response.data.user)
                setInput("");
            }
            else
                console.log(response.data.error);
        })
        .catch(() => {
            console.log("erreur");
        })
    }
    return (
        <div>
            <h3>Search for a player</h3>
            <input type="text" placeholder="Username" value={input} maxLength={10} onChange={(e) => setInput(e.target.value)} />
            <button onClick={() => handleSearch()}>Search</button>
            {user && <Profile handleBlock={handleBlock} handleUnblock={handleUnblock} handleDel={handleDel} user={user} login={login} handleAdd={handleAdd} blockeds={blockeds} friends={friends} socket={socket}/>}
        </div>
    )
}
