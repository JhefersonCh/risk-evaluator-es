/**
 * Utilidades de construcción de DOM.
 *
 * No hay framework: un constructor de elementos tipado alcanza y sobra
 * para esta aplicación. Todo el texto entra como nodo de texto, así que
 * no hay forma de inyectar marcado por accidente.
 */

export type Child = Node | string | number | false | null | undefined | Child[];

type Attrs = Record<string, unknown>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;

    if (key === 'class') {
      node.className = String(value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value as Partial<CSSStyleDeclaration>);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'text') {
      node.textContent = String(value);
    } else if (key in node && !key.startsWith('data-') && !key.startsWith('aria-')) {
      (node as unknown as Record<string, unknown>)[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }

  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) {
      append(parent, child);
      continue;
    }
    parent.appendChild(
      child instanceof Node ? child : document.createTextNode(String(child)),
    );
  }
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/* ------------------------------------------------------------------ */
/* Envoltorios de layout                                               */
/* ------------------------------------------------------------------ */

/** Ancho de lectura del sistema. Una sola definición para toda la app. */
export function wrap(...children: Child[]): HTMLElement {
  return el('div', { class: 'mx-auto w-full max-w-[1180px] px-4 sm:px-6' }, children);
}

/** Contenedor de pantalla, con la entrada animada del sistema. */
export function screen(...children: Child[]): HTMLElement {
  return el('section', { class: 'flex-1 animate-screen-in' }, children);
}

/** Etiqueta monoespaciada en versalitas, usada como encabezado de bloque. */
export function eyebrow(content: string): HTMLElement {
  return el('p', { class: 'eyebrow', text: content });
}

/** Ficha compacta para condiciones, hechos y referencias a reglas. */
export function chip(content: string, derived = false): HTMLElement {
  return el('span', {
    class: derived ? 'chip chip--derived' : 'chip',
    text: content,
  });
}

/** Regla horizontal fina, del grosor del papel. */
export function hairline(extra = ''): HTMLElement {
  return el('div', {
    class: `h-px bg-line ${extra}`.trim(),
    'aria-hidden': 'true',
  });
}

export function signed(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

/* ------------------------------------------------------------------ */
/* Movimiento                                                          */
/* ------------------------------------------------------------------ */

/** ¿El usuario pidió menos movimiento? Entonces no hay reproducción animada. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Anima un número entero de `from` a `to`.
 * Devuelve una función para cancelar la animación en curso.
 */
export function countTo(
  node: HTMLElement,
  from: number,
  to: number,
  duration = 420,
  onFrame?: (value: number) => void,
): () => void {
  if (from === to || prefersReducedMotion()) {
    node.textContent = String(to);
    onFrame?.(to);
    return () => {};
  }

  const start = performance.now();
  let frame = 0;

  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    // Desaceleración: el número llega y se asienta, no frena de golpe.
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (to - from) * eased);
    node.textContent = String(value);
    onFrame?.(value);
    if (progress < 1) frame = requestAnimationFrame(step);
  };

  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
