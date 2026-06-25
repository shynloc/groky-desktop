const recentChats = [
  { title: 'AI coding tools comparison', time: '2 min ago' },
  { title: 'Refactor auth system to JWT', time: '1 hour ago' },
  { title: 'Explain project architecture', time: 'Yesterday' },
  { title: 'Write unit tests for stores', time: 'Jun 23' },
];

export function WorkChatSidebar() {
  return (
    <div className="work-sidebar-content">
      {recentChats.map((chat) => (
        <div key={chat.title} className="work-sidebar-item chat-item">
          <div>
            <div className="work-sidebar-item-name">{chat.title}</div>
            <div className="work-sidebar-item-meta">{chat.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
