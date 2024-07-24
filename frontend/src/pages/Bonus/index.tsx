
import { useEffect } from 'react';
import ModelViewer from '../../components/ModelViewer/ModelViewer';
import { useSocket } from '../../components/Socket';


function Bonus() {
  const socket =  useSocket();

  useEffect(() => {
        if (socket)
            socket.emit("QUIT_QUEUE");
    }, [socket])
  return (
	<ModelViewer />
  )
}

export default Bonus;
