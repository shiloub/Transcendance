/* eslint-disable */
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../components/Socket";

function History({list, user}) {
    return (
        <div>
            <h2>History</h2>
            <ul className="history_list">
                {list.map((game: any) => {
                    return (
                        <li className="game_results" key={game.id}>
                            <span>{game.login1}</span> <span>{game.score1} - {game.score2}</span> <span>{game.login2}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    )
}

function Stat({ list, user }) {
    const [wins, setWins] = useState(0);
    const [loses, setLoses] = useState(0);

    useEffect(() => {
      list.forEach((game: any) => {
        if (game.login1 === user.login) {
          if (game.score1 >= game.score2) {
            setWins((prevWins) => prevWins + 1);
          } else {
            setLoses((prevLoses) => prevLoses + 1);
          }
        } else {
          if (game.score2 >= game.score1) {
            setWins((prevWins) => prevWins + 1);
          } else {
            setLoses((prevLoses) => prevLoses + 1);
          }
        }
      });
    }, [list, user]);

    return (
        <div>
            <h2>Stats</h2>
            <div>
                <span>Wins {wins} - {loses} Loses</span>
            </div>
        </div>
    )

}

export default function Profile() {

    const {userId} = useParams();
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [timestamp, setTimestamp] = useState(Date.now());
    const urlAvatar = user ? `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/${user.id}/avatar?timestamp=${timestamp}` : "";

    const socket = useSocket();

    useEffect(() => {
        if (socket)
        socket.emit("QUIT_QUEUE");
    }, [socket])

    useEffect(() => {
        const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/users/otherById?id=` + userId;
        axios.get(url, {withCredentials: true})
        .then((response) => {
            if (response.data.user) {
                setUser(response.data.user);
            }
            else {
                console.log(response.data.error);
            }
        })
    }, [userId])

    useEffect(() => {
        if (user){
            const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/history?login=` + user.login;

            axios.get(url, {withCredentials: true})
            .then ((response) => {
                if (response.data.history)
                    {
                        setHistory(response.data.history);
                    }
                else {
                    console.log(response.data.error);

                }
            })
            .catch(() => {
                console.log("impossible de parler au serveur");
            })
        }
    }, [user])

    return (
        (user && <div className="profile">
            <div className="infos">
                <div className="user">
                    <h2>{user.login}</h2>
                    <img className="avatar" src={urlAvatar} alt="avatar" />
                </div>
                <Stat list={history} user={user} />
                <History list={history} user={user} />
            </div>
        </div> )
    )
}

// const urlAvatar = `http:// HOST :3001/users/${me.id}/avatar?timestamp=${timestamp}`;
