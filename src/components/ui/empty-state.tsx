type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-content">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
