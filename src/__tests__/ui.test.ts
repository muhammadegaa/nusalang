/**
 * Tests for UI Renderer
 */

import { describe, it, expect } from 'vitest';
import {
  renderUiBlock,
  renderPage,
  createElement,
  createText,
} from '../runtime/ui.js';
import { UiBlockNode } from '../ast.js';

describe('UI Renderer', () => {
  it('should render simple JSX element', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [
        createElement('div', {}, createText('Hello World')),
      ],
    };

    const html = renderUiBlock(uiBlock);
    expect(html).toContain('<div>');
    expect(html).toContain('Hello World');
    expect(html).toContain('</div>');
  });

  it('should render nested elements', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [
        createElement(
          'div',
          {},
          createElement('h1', {}, createText('Title')),
          createElement('p', {}, createText('Content'))
        ),
      ],
    };

    const html = renderUiBlock(uiBlock);
    expect(html).toContain('<div>');
    expect(html).toContain('<h1>');
    expect(html).toContain('Title');
    expect(html).toContain('<p>');
    expect(html).toContain('Content');
  });

  it('should render self-closing tags', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [createElement('img', { src: 'test.jpg', alt: 'Test' })],
    };

    const html = renderUiBlock(uiBlock);
    expect(html).toContain('<img');
    expect(html).toContain('src="test.jpg"');
    expect(html).toContain('alt="Test"');
    expect(html).toContain('/>');
  });

  it('should render attributes', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [
        createElement('div', { class: 'container', id: 'main' }, createText('Content')),
      ],
    };

    const html = renderUiBlock(uiBlock);
    expect(html).toContain('class="container"');
    expect(html).toContain('id="main"');
  });

  it('should render complete page with UI block', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [
        createElement('h1', {}, createText('Welcome')),
      ],
    };

    const html = renderPage('/home', uiBlock);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('<body>');
    expect(html).toContain('<h1>');
    expect(html).toContain('Welcome');
  });

  it('should render non-pretty HTML', () => {
    const uiBlock: UiBlockNode = {
      type: 'UiBlock',
      elements: [createElement('div', {}, createText('Test'))],
    };

    const html = renderUiBlock(uiBlock, { pretty: false });
    expect(html).not.toContain('\n  ');
    expect(html).toContain('<div>Test</div>');
  });
});

