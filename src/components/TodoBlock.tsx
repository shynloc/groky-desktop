import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { TodoItem } from '../types';

interface TodoBlockProps {
  todos: TodoItem[];
}

export function TodoBlock({ todos }: TodoBlockProps) {
  return (
    <div className="todo-block">
      <div className="todo-block-header">Tasks</div>
      <div className="todo-list">
        {todos.map((todo) => (
          <div key={todo.id} className={`todo-item ${todo.status}`}>
            {todo.status === 'completed' ? (
              <CheckCircle size={13} className="todo-icon completed" />
            ) : todo.status === 'in_progress' ? (
              <Loader2 size={13} className="todo-icon in-progress spin" />
            ) : (
              <Circle size={13} className="todo-icon pending" />
            )}
            <span className={`todo-text ${todo.status === 'completed' ? 'done' : ''}`}>
              {todo.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
