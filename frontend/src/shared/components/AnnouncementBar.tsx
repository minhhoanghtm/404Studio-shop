import React from 'react';

const messages = [
  'BỘ SƯU TẬP SPRING / SUMMER 2026 ĐÃ RA MẮT',
  'MIỄN PHÍ VẬN CHUYỂN GĂNG TAY TRẮNG TOÀN QUỐC',
  'ĐỔI TRẢ TRONG 07 NGÀY TỪ KHI NHẬN HÀNG',
];

export const AnnouncementBar: React.FC = () => {
  const content = messages.map((message) => <React.Fragment key={message}><span>{message}</span><b aria-hidden="true">•</b></React.Fragment>);
  return <aside aria-label="Thông báo cửa hàng" className="announcement-marquee"><div className="announcement-track"><div>{content}</div><div aria-hidden="true">{content}</div></div></aside>;
};
