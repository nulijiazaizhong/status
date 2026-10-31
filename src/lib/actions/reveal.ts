export function reveal(node: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    node.dataset.visible = 'true';
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      node.dataset.visible = 'true';
      observer.disconnect();
    }
  }, { threshold: 0.08 });
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
