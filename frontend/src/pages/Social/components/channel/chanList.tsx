import axios from "axios";
import "/app/src/css/style.css";
import { useEffect, useState } from "react";

async function getName(name:string) {
    if (!name.includes("-"))
        return (name)
    const url = `http://${process.env.REACT_APP_CURRENT_HOST}:3001/channel/directChatPrintableName?name=` + name;
    const trueName = await axios.get(url, {withCredentials: true})
    .then((response) => {
        if (response.data.otherLogin)
        {
            return (response.data.otherLogin);
        }
        else
        {
            console.log('erreur dans getblala');
        }
    })
    .catch(() => {
        console.log("erour");
    })
    return (trueName);
}
export default function ChanList({ list, handleSelect, login }) {
    const [resolvedNames, setResolvedNames] = useState([]);

    useEffect(() => {
      const promises = list.map((channel) => getName(channel.name));

      Promise.all(promises)
        .then((resolved) => {
          setResolvedNames(resolved);
        })
        .catch((error) => {
          console.error("Error resolving names: ", error);
        });
    }, [list, login]);

    return (
      <ul className="chanList">
        {resolvedNames.length !== 0 && resolvedNames.map((name, index) => (
          <li key={index} onClick={() => handleSelect(list[index])}>
            {name}
          </li>
        ))}
      </ul>
    );
  }
