import '@testing-library/jest-dom';
import { vi } from 'vitest';

// scrollIntoView and scrollTo are not implemented in jsdom
window.Element.prototype.scrollIntoView = vi.fn();
window.Element.prototype.scrollTo = vi.fn();
