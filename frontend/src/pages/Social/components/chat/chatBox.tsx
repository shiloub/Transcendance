import "/app/src/css/style.css";
export default function Chatbox({messages, login, blockeds}) {


    return (
        <ul className="chatbox">
            {messages.map((message: any) => {
                const classname = login === message.senderLogin ? "myMessage": "notMyMessage";
                if (!blockeds.includes(message.senderId))
                    return (<li key={message.id} className={classname}>{message.senderLogin}:  {message.content}</li>)
                else
                    return (null);
            }
            )}
        </ul>
    )
}
