/**
 * Standard Library - UI Module
 * Provides UI rendering utilities for NusaLang applications
 */

export interface UiElement {
  type: string;
  props: Record<string, any>;
  children: (UiElement | string)[];
}

/**
 * Create a UI element
 */
export function createElement(
  type: string,
  props: Record<string, any> = {},
  ...children: (UiElement | string)[]
): UiElement {
  return {
    type,
    props,
    children,
  };
}

/**
 * Render UI element to HTML string
 */
export function renderToString(element: UiElement | string): string {
  if (typeof element === 'string') {
    return element;
  }

  const { type, props, children } = element;
  const propsStr = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  const childrenStr = children.map(renderToString).join('');

  if (childrenStr) {
    return `<${type}${propsStr ? ' ' + propsStr : ''}>${childrenStr}</${type}>`;
  }

  return `<${type}${propsStr ? ' ' + propsStr : ''} />`;
}

/**
 * Helper to create common elements
 */
export const h1 = (text: string) => createElement('h1', {}, text);
export const h2 = (text: string) => createElement('h2', {}, text);
export const p = (text: string) => createElement('p', {}, text);
export const div = (...children: (UiElement | string)[]) => createElement('div', {}, ...children);

export const ui = {
  createElement,
  renderToString,
  h1,
  h2,
  p,
  div,
};

