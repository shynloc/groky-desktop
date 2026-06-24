interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="suggested-prompts">
      <div className="suggested-prompts-title">Suggested</div>
      <div className="suggested-prompts-list">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            className="suggested-prompt-item"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Default prompts based on context
export function getDefaultPrompts(hasProject: boolean): string[] {
  if (!hasProject) {
    return [
      'Open a project folder',
      'Start a new chat',
      'Explain how Groky works',
    ];
  }

  return [
    'Explain the architecture of this project',
    'Find and fix any bugs',
    'Write unit tests for the main module',
    'Refactor this code for better readability',
  ];
}
