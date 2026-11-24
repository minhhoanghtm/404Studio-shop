import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className,
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = prefersReducedMotion !== false;

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.68, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
};
