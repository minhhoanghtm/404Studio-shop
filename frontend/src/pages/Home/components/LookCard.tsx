import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LookItem } from '../data/editorialData';
import { formatCurrency } from '../../../shared/utils/formatters';

interface LookCardProps {
  look: LookItem;
}

export const LookCard: React.FC<LookCardProps> = ({ look }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="we-look-card">
      {/* 4:5 Top Image */}
      <div className="we-look-image">
        {!imgFailed ? (
          <img
            src={look.image}
            alt={look.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="we-image-fallback">
            <b>{look.title}</b>
            <i />
          </div>
        )}
        <span className="we-look-tag">{look.tag}</span>
      </div>

      {/* Look Title & Collection Meta */}
      <div className="we-look-title">
        <h3 className="we-look-name">{look.title}</h3>
        <span className="we-look-meta">{look.collection}</span>
      </div>

      {/* 3 Metrics: Số món / Mùa / Dịp mặc */}
      <div className="we-look-metrics">
        <div className="we-metric-box">
          <b>{look.metrics.items.split(' ')[0]}</b>
          <small>{look.metrics.items.split(' ').slice(1).join(' ') || 'MÓN'}</small>
        </div>
        <div className="we-metric-box">
          <b>{look.metrics.season.split(' ')[0]}</b>
          <small>{look.metrics.season.split(' ').slice(1).join(' ') || 'MÙA'}</small>
        </div>
        <div className="we-metric-box">
          <b>{look.metrics.occasion.split(' ')[0]}</b>
          <small>{look.metrics.occasion.split(' ').slice(1).join(' ') || 'DỊP MẶC'}</small>
        </div>
      </div>

      {/* 2-line Description */}
      <p className="we-look-desc">{look.description}</p>

      {/* Fabric Mono Line */}
      <div className="we-look-fabric">
        <span className="we-fabric-prefix">Chất liệu:</span> {look.fabric}
      </div>

      {/* SHOP THE LOOK Items List */}
      <div className="we-shop-the-look">
        <div className="we-shop-header">SHOP THE LOOK</div>
        <ul className="we-shop-list">
          {look.shopItems.map((item, idx) => (
            <li key={`${item.name}-${idx}`} className="we-shop-item-row">
              <Link to={item.link} className="we-shop-item-link">
                <span className="we-item-name">{item.name}</span>
                <span className="we-item-price-wrap">
                  <span className="we-item-price">{formatCurrency(item.price)}</span>
                  <ArrowRight size={14} className="we-item-arrow" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export default LookCard;
