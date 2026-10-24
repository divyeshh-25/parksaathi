import './StatCard.css';

function StatCard({ title, value, description, icon, variant = 'blue' }) {
    return (
        <article className={`stat-card stat-card--${variant}`}>
            <div className="stat-card__top">
                <h3 className="stat-card__title">{title}</h3>

                <div className="stat-card__icon" aria-hidden="true">
                    {icon}
                </div>
            </div>

            <p className="stat-card__value">{value}</p>

            {description && (
                <p className="stat-card__description">{description}</p>
            )}
        </article>
    );
}

export default StatCard;